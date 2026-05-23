import { Request, Response } from "express";
import prisma from "../lib/database";
import { generateSessionId, getCartExpiration } from "../lib/cart";

// Helper: Fetch ID Keranjang Berdasarkan Sesi Pengguna
const getOrCreateCart = async (
  customerId: string | null,
  sessionId: string | null,
) => {
  let cart = null;

  if (customerId) {
    // Cari Keranjang untuk Pelanggan yang Login
    cart = await prisma.cart.findFirst({
      where: { customerId },
      include: { items: true },
    });

    // Jika Pelanggan Login dan Memiliki Sesi Sebagai Tamu, Maka Keranjang Digabungkan
    if (sessionId && !cart) {
      const guestCart = await prisma.cart.findFirst({
        where: { sessionId },
        include: { items: true },
      });

      if (guestCart) {
        // Transfer Isi Keranjang bagi Sesi Tamu ke Dalam Keranjang Pelanggan yang Sudah Login
        cart = await prisma.$transaction(async (tx) => {
          // Perbarui Keranjang Tamu Menjadi Keranjang Pengguna
          const updatedCart = await tx.cart.update({
            where: { id: guestCart.id },
            data: {
              customerId,
              sessionId: null,
              expiresAt: getCartExpiration(),
            },
            include: { items: true },
          });

          return updatedCart;
        });
      }
    }
  }

  if (!cart && sessionId) {
    cart = await prisma.cart.findFirst({
      where: { sessionId },
      include: { items: true },
    });
  }

  // Jika Masih Belum Ada Keranjang, Buat Baru
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        customerId: customerId || null,
        sessionId: sessionId || (customerId ? null : generateSessionId()),
        expiresAt: getCartExpiration(),
      },
      include: { items: true },
    });
  }

  return cart;
};

// Memuat Data Pesanan
export const getMyCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers["x-session-id"] as string;

    const cart = await getOrCreateCart(userId || null, sessionId || null);

    // Hitung Total
    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Cek Stok untuk Setiap Item (Validasi)
    const itemsWithStock = await Promise.all(
      cart.items.map(async (item) => {
        let isAvailable = true;
        let availableStock = 0;

        if (item.itemType === "BOOK" && cart.storeId) {
          const stock = await prisma.bookStock.findUnique({
            where: {
              bookId_storeId: {
                bookId: item.itemId,
                storeId: cart.storeId!,
              },
            },
          });
          availableStock = stock?.stock || 0;
          isAvailable = availableStock >= item.quantity;
        }

        return {
          ...item,
          isAvailable,
          availableStock,
        };
      }),
    );

    res.status(200).json({
      success: true,
      cart: {
        id: cart.id,
        storeId: cart.storeId,
        items: itemsWithStock,
        total,
        itemCount: cart.items.length,
        expiresAt: cart.expiresAt,
      },
    });
  } catch (error) {
    console.error("Anda tidak dapat fetch isi keranjang Anda:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Memasukkan Produk ke Dalam Keranjang
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers["x-session-id"] as string;
    const { itemType, itemId, quantity, storeId } = req.body;

    if (!itemType || !itemId || !quantity || !storeId) {
      return res
        .status(400)
        .json({ error: "Semua field tidak boleh ada yang kosong." });
    }

    if (!["BOOK", "BEVERAGE"].includes(itemType)) {
      return res.status(400).json({ error: "Tipe item tidak valid." });
    }

    const qty = typeof quantity === "string" ? parseInt(quantity) : quantity;
    if (qty < 1) {
      return res
        .status(400)
        .json({ error: "Minimal ada 1 kuantitas dalam melakukan pemesanan." });
    }

    // Validasi Toko
    const store = await prisma.store.findUnique({
      where: { id: String(storeId) },
    });

    if (!store) {
      return res.status(404).json({ error: "Toko buku tidak ditemukan." });
    }

    // Validasi Item dan Dapatkan Harganya
    let itemData = null;

    if (itemType === "BOOK") {
      const book = await prisma.book.findUnique({
        where: { id: String(itemId) },
      });

      if (!book) {
        return res.status(404).json({ error: "Buku tidak ditemukan." });
      }

      // Cek Stok
      const stock = await prisma.bookStock.findUnique({
        where: {
          bookId_storeId: {
            bookId: String(itemId),
            storeId: String(storeId),
          },
        },
      });

      if (!stock || stock.stock < qty) {
        return res.status(400).json({ error: "Stok tidak mencukupi." });
      }

      itemData = {
        name: book.title,
        price: book.price,
      };
    } else {
      const beverage = await prisma.beverage.findUnique({
        where: { id: String(itemId) },
      });

      if (!beverage) {
        return res.status(404).json({ error: "Minuman tidak ditemukan." });
      }

      if (!beverage.isAvailable) {
        return res.status(400).json({ error: "Minuman tidak tersedia." });
      }

      itemData = {
        name: beverage.name,
        price: beverage.price,
      };
    }

    // Dapatkan atau Buat Keranjang
    let cart = await getOrCreateCart(userId || null, sessionId || null);

    // Jika Keranjang Memiliki ID Toko yang Berbeda, Konfirmasi
    if (cart.storeId && cart.storeId !== storeId) {
      return res.status(400).json({
        error: `Keranjang Anda telah memiliki produk dari toko ${cart.storeId}, silahkan bersihkan keranjang Anda terlebih dahulu agar dapat memasukkan produk dari toko ini atau Anda juga dapat memilih toko yang sama.`,
      });
    }

    // Cek Apakah Item Sudah Ada di Dalam Keranjang
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_itemType_itemId: {
          cartId: cart.id,
          itemType: itemType as any,
          itemId: String(itemId),
        },
      },
    });

    if (existingItem) {
      // Perbarui Kuantitas
      const newQuantity = existingItem.quantity + qty;

      // Validasi Stok untuk Buku
      if (itemType === "BOOK") {
        const stock = await prisma.bookStock.findUnique({
          where: {
            bookId_storeId: {
              bookId: String(itemId),
              storeId: String(storeId),
            },
          },
        });

        if (!stock || stock.stock < newQuantity) {
          return res.status(400).json({
            error:
              "Stok tidak mencukupi untuk menambah kuantitas pada produk ini.",
          });
        }
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });

      // Update ID Toko dalam Keranjang Jika Belum Ada
      if (!cart.storeId) {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { storeId: String(storeId) },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Kuantitas item dalam keranjang berhasil diperbarui.",
        item: updatedItem,
      });
    }

    // Tambah Item Baru
    const newItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        itemType: itemType as any,
        itemId: String(itemId),
        name: itemData.name,
        price: itemData.price,
        quantity: qty,
      },
    });

    // Perbarui Toko Buku dalam Keranjang
    if (!cart.storeId) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { storeId: String(storeId) },
      });
    }

    res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan ke dalam keranjang.",
      item: newItem,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menambahkan produk ke dalam keranjang:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};

// Perbarui Kuantitas Item dalam Keranjang
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers["x-session-id"] as string;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res
        .status(400)
        .json({ error: "Kuantitas pada satu produk harus valid." });
    }

    const cart = await getOrCreateCart(userId || null, sessionId || null);

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: String(itemId),
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      return res
        .status(404)
        .json({ error: "Produk dalam keranjang tidak ditemukan." });
    }

    if (quantity === 0) {
      // Hapus Item Jika Kuantitas 0
      await prisma.cartItem.delete({
        where: { id: cartItem.id },
      });

      //  Cek Apakah Keranjang Kosong, Reset ID Toko
      const remainingItems = await prisma.cartItem.count({
        where: { cartId: cart.id },
      });

      if (remainingItems === 0) {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { storeId: null },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Produk telah dibuang dari keranjang.",
      });
    }

    // Validasi Stok untuk Buku
    if (cartItem.itemType === "BOOK" && cart.storeId) {
      const stock = await prisma.bookStock.findUnique({
        where: {
          bookId_storeId: {
            bookId: cartItem.itemId,
            storeId: cart.storeId,
          },
        },
      });

      if (!stock || stock.stock < quantity) {
        return res.status(400).json({ error: "Stok tidak mencukupi." });
      }
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: {
        quantity: typeof quantity === "string" ? parseInt(quantity) : quantity,
      },
    });

    res.status(200).json({
      success: true,
      message: "Produk dalam keranjang berhasil diperbarui.",
      item: updatedItem,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat memperbarui produk yang sudah tersimpan di dalam keranjang Anda:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};

// Menghapus Item dari Keranjang
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers["x-session-id"] as string;
    const { itemId } = req.params;

    const cart = await getOrCreateCart(userId || null, sessionId || null);

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: String(itemId),
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      return res
        .status(404)
        .json({ error: "Produk dalam keranjang tidak ditemukan." });
    }

    await prisma.cartItem.delete({
      where: { id: cartItem.id },
    });

    // Cek Apakah Keranjang Kosong, Reset ID Toko
    const remainingItems = await prisma.cartItem.count({
      where: { cartId: cart.id },
    });

    if (remainingItems === 0) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { storeId: null },
      });
    }

    res.status(200).json({
      success: true,
      message: "Produk telah dibuang dari keranjang.",
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menghapus produk yang sudah tersimpan di dalam keranjang Anda:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};

// Bersihkan Semua Item yang Ada di Dalam Keranjang
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers["x-session-id"] as string;

    const cart = await getOrCreateCart(userId || null, sessionId || null);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: { storeId: null },
    });

    res.status(200).json({
      success: true,
      message: "Keranjang berhasil dibersihkan.",
    });
  } catch (error) {
    console.error("Anda tidak dapat membersihkan keranjang Anda:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Mengubah Toko dalam Keranjang
export const selectStore = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers["x-session-id"] as string;
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: "ID toko tidak boleh kosong." });
    }

    const store = await prisma.store.findUnique({
      where: { id: String(storeId) },
    });

    if (!store) {
      return res.status(404).json({ error: "Toko buku tidak ditemukan." });
    }

    const cart = await getOrCreateCart(userId || null, sessionId || null);

    // Jika Keranjang Sudah Memiliki Item, Cek Apakah Boleh Ganti Toko
    const itemCount = await prisma.cartItem.count({
      where: { cartId: cart.id },
    });

    if (itemCount > 0) {
      return res.status(400).json({
        error:
          "Anda harus membersihkan keranjang Anda secara keseluruhan terlebih dahulu agar dapat mengganti cabang toko.",
      });
    }

    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: { storeId: String(storeId) },
    });

    res.status(200).json({
      success: true,
      message: "Toko dipilih.",
      storeId: updatedCart.storeId,
    });
  } catch (error) {
    console.error("Anda tidak dapat memilih toko:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};
