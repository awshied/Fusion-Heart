import { Request, Response } from "express";
import prisma from "../lib/database";
import {
  generateSessionId,
  getCartExpiration,
  isCartExpired,
} from "../lib/cart";

// Helper: Validasi ID
const getStringParam = (
  param: string | string[] | undefined,
): string | undefined => {
  if (typeof param === "string") return param;
  if (Array.isArray(param) && param.length > 0) return param[0];
  return undefined;
};

// Helper: Generate Nomor Invoice
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `INV/${year}${month}${day}/${random}`;
};

// Helper: Hitung Jarak untuk Biaya Pengiriman
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper: Hitung Biaya Pengiriman
const calculateDeliveryFee = (distanceKm: number): number => {
  const feePerKm = 2500;
  const minFee = 5000;
  const fee = distanceKm * feePerKm;
  return Math.max(fee, minFee);
};

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

// Checkout dari Keranjang
export const checkoutFromCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const sessionId = req.headers["x-session-id"] as string;

    if (!userId && !sessionId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu," });
    }

    const {
      paymentMethod,
      promoCode,
      notes,
      orderType,
      customerLat,
      customerLng,
      customerAddress,
      tableBooking,
    } = req.body;

    // Validasi Tipe Pesanan
    if (!orderType || !["DELIVERY", "PICKUP"].includes(orderType)) {
      return res.status(400).json({ error: "Tipe pesanan harus valid." });
    }

    // Validasi Metode Pembayaran
    if (!paymentMethod || !["TRANSFER", "COD"].includes(paymentMethod)) {
      return res.status(400).json({ error: "Metode pembayaran harus valid." });
    }

    // Dapatkan Keranjang
    const cart = await getOrCreateCart(userId || null, sessionId || null);

    if (!cart.storeId) {
      return res
        .status(400)
        .json({ error: "Silahkan tentukan toko cabang terlebih dahulu." });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({ error: "Keranjang kosong." });
    }

    // Cek Apakah Keranjang Sudah Kadaluarsa
    if (isCartExpired(cart.expiresAt)) {
      return res.status(400).json({
        error:
          "Keranjang sudah kadaluarsa, silahkan untuk menambahkan item kembali.",
      });
    }

    // Cek Apakah Toko Ada
    const store = await prisma.store.findUnique({
      where: { id: cart.storeId },
    });

    if (!store) {
      return res.status(404).json({ error: "Toko buku tidak ditemukan." });
    }

    // Proses Berdasarkan Tipe Pesanan
    let deliveryFee = 0;
    let customerLatFinal = null;
    let customerLngFinal = null;
    let customerAddressFinal = null;
    let tableBookingData = null;

    if (orderType === "DELIVERY") {
      // Validasi untuk Pengiriman
      if (!customerLat || !customerLng || !customerAddress) {
        return res.status(400).json({
          error: "Lokasi pelanggan harus ada agar pesanan dapat dikirim.",
        });
      }

      // Cek Apakah Ada Minuman dalam Keranjang (Minuman Hanya Untuk Nongkrong di Tempat)
      const hasBeverage = cart.items.some(
        (item) => item.itemType === "BEVERAGE",
      );
      if (hasBeverage) {
        return res.status(400).json({
          error:
            "Minuman tidak bisa dikirim, silahkan pilih ambil di tempat atau hapus minuman dari keranjang.",
        });
      }

      customerLatFinal =
        typeof customerLat === "string" ? parseFloat(customerLat) : customerLat;
      customerLngFinal =
        typeof customerLng === "string" ? parseFloat(customerLng) : customerLng;
      customerAddressFinal = String(customerAddress);

      // Hitung Jarak dan Biaya Pengiriman
      const distance = calculateDistance(
        store.lat,
        store.lng,
        customerLatFinal,
        customerLngFinal,
      );
      deliveryFee = calculateDeliveryFee(distance);
    }

    if (orderType === "PICKUP") {
      // Jika Booking Meja, Validasi
      if (tableBooking) {
        const { tableId, bookingDate, duration } = tableBooking;

        if (!tableId || !bookingDate || !duration) {
          return res
            .status(400)
            .json({ error: "Data booking meja belum lengkap." });
        }

        const table = await prisma.table.findUnique({
          where: { id: String(tableId) },
        });

        if (!table || table.storeId !== cart.storeId) {
          return res
            .status(404)
            .json({ error: "Meja tidak ditemukan dalam toko ini." });
        }

        const targetDate = new Date(bookingDate);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const existingBooking = await prisma.tableBooking.findFirst({
          where: {
            tableId: String(tableId),
            bookingDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: { not: "CANCELLED" },
          },
        });

        if (existingBooking) {
          return res.status(409).json({
            error: "Seseorang telah melakukan reservasi pada meja ini.",
          });
        }

        tableBookingData = {
          tableId: String(tableId),
          customerId: userId!,
          bookingDate: targetDate,
          duration:
            typeof duration === "string" ? parseInt(duration) : duration,
          status: "PENDING",
        };
      }
    }

    // Validasi Stok untuk Setiap Item di Keranjang
    for (const item of cart.items) {
      if (item.itemType === "BOOK") {
        const stock = await prisma.bookStock.findUnique({
          where: {
            bookId_storeId: {
              bookId: item.itemId,
              storeId: cart.storeId!,
            },
          },
        });

        const availableStock = stock?.stock || 0;

        if (availableStock < item.quantity) {
          return res.status(400).json({
            error: `Stok pada ${item.name} tidak mencukupi, hanya ada ${availableStock} yang tersisa.`,
            item: {
              id: item.id,
              name: item.name,
              requested: item.quantity,
              available: availableStock,
            },
          });
        }
      }
    }

    // Hitung Subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += item.price * item.quantity;
    }

    // Hitung Diskon
    let discount = 0;
    let appliedPromoCode = null;
    if (promoCode) {
      const promo = await prisma.promo.findUnique({
        where: { code: promoCode.toUpperCase() },
      });

      if (
        promo &&
        promo.isActive &&
        promo.validFrom <= new Date() &&
        promo.validUntil >= new Date()
      ) {
        if (!promo.usageLimit || promo.usageCount < promo.usageLimit) {
          if (subtotal >= (promo.minPurchase || 0)) {
            if (promo.discountType === "PERCENTAGE") {
              discount = subtotal * (promo.discountValue / 100);
              if (promo.maxDiscount && discount > promo.maxDiscount) {
                discount = promo.maxDiscount;
              }
            } else {
              discount = promo.discountValue;
            }
            appliedPromoCode = promoCode.toUpperCase();
          }
        }
      }
    }

    const total = subtotal + deliveryFee - discount;
    const invoiceNumber = generateInvoiceNumber();

    // Buat Pesanan dengan Transaksi
    const result = await prisma.$transaction(async (tx) => {
      // Kurangi Stok Buku
      for (const item of cart.items) {
        if (item.itemType === "BOOK") {
          await tx.bookStock.update({
            where: {
              bookId_storeId: {
                bookId: item.itemId,
                storeId: cart.storeId!,
              },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // Booking Meja Jika Ada yang Kosong
      let tableBookingCreated = null;
      if (tableBookingData && orderType === "PICKUP") {
        tableBookingCreated = await tx.tableBooking.create({
          data: {
            tableId: tableBookingData.tableId,
            customerId: tableBookingData.customerId,
            bookingDate: tableBookingData.bookingDate,
            duration: tableBookingData.duration,
            status: tableBookingData.status,
          },
        });
      }

      // Buat Pesanan
      const newOrder = await tx.order.create({
        data: {
          invoiceNumber,
          customerId: userId || null,
          storeId: cart.storeId,
          tableBookingId: tableBookingCreated?.id,
          orderType: orderType as any,
          paymentMethod: paymentMethod as any,
          paymentStatus: "UNPAID",
          orderStatus: "PENDING",
          subtotal,
          deliveryFee,
          discount,
          total,
          promoCode: appliedPromoCode,
          notes: notes ? String(notes) : null,
          customerLat: customerLatFinal,
          customerLng: customerLngFinal,
          customerAddress: customerAddressFinal,
        },
      });

      // Perbarui Booking Meja dengan ID Pesanan
      if (tableBookingCreated) {
        await tx.tableBooking.update({
          where: { id: tableBookingCreated.id },
          data: { orderId: newOrder.id },
        });
      }

      // Buat Pesanan dari Keranjang
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            itemType: item.itemType,
            itemId: item.itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          },
        });
      }

      // Hapus Keranjang Setelah Checkout
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { storeId: null },
      });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      message: "Pesanan berhasil dibuat.",
      order: {
        id: result.id,
        invoiceNumber: result.invoiceNumber,
        orderType: result.orderType,
        paymentMethod: result.paymentMethod,
        paymentStatus: result.paymentStatus,
        orderStatus: result.orderStatus,
        subtotal: result.subtotal,
        deliveryFee: result.deliveryFee,
        discount: result.discount,
        total: result.total,
        notes: result.notes,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error("Anda tidak bisa chekcout:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Memuat Data Pesanan
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: userId },
      include: {
        items: true,
        store: {
          select: { name: true, address: true, city: true },
        },
        driver: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat fetch semua data riwayat pesanan Anda:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};

// Menampilkan Data Pesanan Berdasarkan ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const orderId = getStringParam(id);

    if (!orderId) {
      return res.status(400).json({ error: "ID pesanan tidak valid." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        store: true,
        driver: {
          select: { id: true, name: true, phone: true },
        },
        tableBooking: {
          include: { table: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    // Cek Apakah Pengguna Adalah Pemesan atau Admin
    if (order.customerId !== userId && (req as any).user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menangkap data pesanan berdasarkan ID:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};

// Membatalkan Pesanan
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const orderId = getStringParam(id);

    if (!orderId) {
      return res.status(400).json({ error: "ID pesanan tidak valid." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, tableBooking: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    if (order.customerId !== userId && (req as any).user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    if (order.orderStatus !== "PENDING") {
      return res
        .status(400)
        .json({ error: "Hanya pesanan pending yang dapat dibatalkan." });
    }

    // Kembalikan Stok Buku
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.itemType === "BOOK") {
          await tx.bookStock.update({
            where: {
              bookId_storeId: {
                bookId: item.itemId,
                storeId: order.storeId!,
              },
            },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Perbarui Status Pesanan
      await tx.order.update({
        where: { id: orderId },
        data: { orderStatus: "CANCELLED" },
      });

      // Batalkan Booking Meja
      if (order.tableBooking) {
        await tx.tableBooking.update({
          where: { id: order.tableBooking.id },
          data: { status: "CANCELLED" },
        });
      }
    });

    res.status(200).json({
      success: true,
      message: "Pesanan baru saja dibatalkan.",
    });
  } catch (error) {
    console.error("Anda tidak dapat membatalkan pesanan Anda:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Proses Transaksi
export const simulatePayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const orderId = getStringParam(id);

    if (!orderId) {
      return res.status(400).json({ error: "ID pesanan tidak valid." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    if (order.customerId !== userId && (req as any).user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ error: "Pesanan sudah dibayar." });
    }

    // Memperbarui Status Pembayaran
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
    });

    res.status(200).json({
      success: true,
      message: "Pembayaran berhasil.",
      paymentStatus: updatedOrder.paymentStatus,
    });
  } catch (error) {
    console.error("Anda tidak dapat melakukan proses transaksi:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};
