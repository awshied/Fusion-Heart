import { Request, Response } from "express";
import prisma from "../lib/database";

// Helper: Validasi ID
const getStringParam = (
  param: string | string[] | undefined,
): string | undefined => {
  if (typeof param === "string") return param;
  if (Array.isArray(param) && param.length > 0) return param[0];
  return undefined;
};

// Menangkap Semua Wishlist yang Tersedia
export const getMyWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const wishlist = await prisma.wishlist.findMany({
      where: { customerId: userId },
      include: {
        book: {
          include: {
            stocks: {
              select: {
                stock: true,
                store: {
                  select: { name: true, city: true },
                },
              },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat fetch semua data wishlist yang tersedia:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Menambahkan Buku-Buku Sebagai Favorit
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { bookId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    if (!bookId) {
      return res.status(400).json({ error: "ID buku harus ada." });
    }

    // Cek Apakah Buku Ada
    const book = await prisma.book.findUnique({
      where: { id: String(bookId) },
    });

    if (!book) {
      return res.status(404).json({ error: "Buku tidak ditemukan." });
    }

    // Cek Apakah Buku Sudah Ada dalam Wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        customerId_bookId: {
          customerId: userId,
          bookId: String(bookId),
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Buku sudah ada dalam wishlist." });
    }

    // Tambahkan Buku ke Wishlist
    const wishlistItem = await prisma.wishlist.create({
      data: {
        customerId: userId,
        bookId: String(bookId),
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            price: true,
            coverImage: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Buku ditambahkan ke dalam wishlist",
      wishlistItem,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menambahkan buku ke dalam wishlist:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Membuang Buku-Buku dari Daftar Favorit
export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { bookId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const bookIdStr = getStringParam(bookId);
    if (!bookIdStr) {
      return res.status(400).json({ error: "ID buku tidak valid." });
    }

    // Cek Apakah Buku Ada dalam Wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        customerId_bookId: {
          customerId: userId,
          bookId: bookIdStr,
        },
      },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ error: "Buku tidak tersedia di dalam wishlist Anda." });
    }

    // Hapus Buku dari Wishlist
    await prisma.wishlist.delete({
      where: {
        customerId_bookId: {
          customerId: userId,
          bookId: bookIdStr,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Buku telah dibuang dari wishlist.",
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat membuang buku dari daftar wishlist Anda:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Cek Apakah Buku-Buku Ada dalam Favorit
export const checkWishlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { bookId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const bookIdStr = getStringParam(bookId);
    if (!bookIdStr) {
      return res.status(400).json({ error: "ID buku tidak ditemukan." });
    }

    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        customerId_bookId: {
          customerId: userId,
          bookId: bookIdStr,
        },
      },
    });

    res.status(200).json({
      success: true,
      isInWishlist: !!wishlistItem,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat memeriksa buku-buku yang ada di dalam wishlist Anda:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};
