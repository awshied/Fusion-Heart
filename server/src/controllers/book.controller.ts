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

// Mendapatkan Semua Buku yang Tersedia
export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const { category, genre, storeId, search } = req.query;

    // Buat Filter
    const where: any = {};

    if (category && typeof category === "string") where.category = category;
    if (genre && typeof genre === "string") where.genre = genre;
    if (search && typeof search === "string") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }

    // Informasi Stok yang Berbeda di Setiap Toko Buku
    const include =
      storeId && typeof storeId === "string"
        ? {
            stocks: {
              where: { storeId: storeId },
              select: {
                stock: true,
                store: { select: { name: true, city: true } },
              },
            },
          }
        : {
            stocks: {
              select: {
                stock: true,
                store: { select: { name: true, city: true } },
              },
            },
          };

    const books = await prisma.book.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    console.error("Anda tidak dapat fetch semua data buku:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Memuat Data Buku Berdasarkan ID
export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    const bookId = getStringParam(id);
    if (!bookId) {
      return res.status(400).json({ error: "ID buku tidak valid." });
    }

    const include: any = {
      reviews: {
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      wishlistItems: false,
    };

    // Informasi Stok yang Berbeda di Setiap Toko
    if (storeId && typeof storeId === "string") {
      include.stocks = {
        where: { storeId: storeId },
        select: { stock: true, store: true },
      };
    } else {
      include.stocks = {
        include: { store: true },
      };
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include,
    });

    if (!book) {
      return res.status(404).json({ error: "Buku tidak ditemukan." });
    }

    res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menangkap data buku berdasarkan ID:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Memasukkan Buku Baru ke Dalam Sistem (Admin Only)
export const createBook = async (req: Request, res: Response) => {
  try {
    const { title, author, description, price, coverImage, category, genre } =
      req.body;

    // Validasi Input
    if (!title || !author || !price || !category || !genre) {
      return res.status(400).json({
        error:
          "Judul buku, nama penulis, harga buku, kategori buku, dan genre buku tidak boleh kosong.",
      });
    }

    // Validasi Kategori
    const validCategories = ["NOVEL", "COMIC"];
    if (!validCategories.includes(category.toUpperCase())) {
      return res.status(400).json({
        error: `Kategori tidak valid. Harus sesuai pada salah satu pilihan kategori: ${validCategories.join(", ")}`,
      });
    }

    // Validasi Genre
    const validGenres = [
      "HORROR",
      "COMEDY",
      "ACTION",
      "GORE",
      "SLICE_OF_LIFE",
      "ROMANCE",
      "MYSTERY",
      "PSYCOLOGY",
      "FANTASY",
      "MATURE",
    ];
    if (!validGenres.includes(genre.toUpperCase())) {
      return res.status(400).json({
        error: `Genre tidak valid. Harus sesuai pada salah satu pilihan genre: ${validGenres.join(", ")}`,
      });
    }

    const book = await prisma.book.create({
      data: {
        title: String(title),
        author: String(author),
        description: description ? String(description) : null,
        price: typeof price === "string" ? parseFloat(price) : Number(price),
        coverImage: coverImage
          ? String(coverImage)
          : "https://via.placeholder.com/300x400?text=No+Cover",
        category: category.toUpperCase() as any,
        genre: genre.toUpperCase() as any,
      },
    });

    res.status(201).json({
      success: true,
      message: "Buku berhasil ditambahkan.",
      book,
    });
  } catch (error) {
    console.error("Anda tidak dapat menambahkan buku baru:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Memperbarui Informasi dan Detail Buku (Admin Only)
export const updateBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const bookId = getStringParam(id);
    if (!bookId) {
      return res.status(400).json({ error: "ID buku tidak valid." });
    }

    const { title, author, description, price, coverImage, category, genre } =
      req.body;

    // Cek Apakah Buku Ada
    const existingBook = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!existingBook) {
      return res.status(404).json({ error: "Buku tidak ditemukan." });
    }

    // Validasi Kategori Untuk Diperbarui
    let validCategory = existingBook.category;
    if (category) {
      const validCategories = ["NOVEL", "COMIC"];
      if (!validCategories.includes(category.toUpperCase())) {
        return res.status(400).json({
          error: `Kategori tidak valid. Harus sesuai pada salah satu pilihan kategori: ${validCategories.join(", ")}`,
        });
      }
      validCategory = category.toUpperCase() as any;
    }

    // Validasi Genre Untuk Diperbarui
    let validGenre = existingBook.genre;
    if (genre) {
      const validGenres = [
        "HORROR",
        "COMEDY",
        "ACTION",
        "GORE",
        "SLICE_OF_LIFE",
        "ROMANCE",
        "MYSTERY",
        "PSYCOLOGY",
        "FANTASY",
        "MATURE",
      ];
      if (!validGenres.includes(genre.toUpperCase())) {
        return res.status(400).json({
          error: `Genre tidak valid. Harus sesuai pada salah satu pilihan genre: ${validGenres.join(", ")}`,
        });
      }
      validGenre = genre.toUpperCase() as any;
    }

    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        title: title ? String(title) : existingBook.title,
        author: author ? String(author) : existingBook.author,
        description:
          description !== undefined
            ? String(description)
            : existingBook.description,
        price: price
          ? typeof price === "string"
            ? parseFloat(price)
            : Number(price)
          : existingBook.price,
        coverImage: coverImage ? String(coverImage) : existingBook.coverImage,
        category: validCategory,
        genre: validGenre,
      },
    });

    res.status(200).json({
      success: true,
      message: "Buku berhasil diperbarui.",
      book: updatedBook,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat memperbarui detail dan informasi buku:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Menghapus buku dari sistem (Admin Only)
export const deleteBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validasi ID
    const bookId = getStringParam(id);
    if (!bookId) {
      return res.status(400).json({ error: "ID buku tidak valid." });
    }

    // Cek Apakah Buku Ada
    const existingBook = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!existingBook) {
      return res.status(404).json({ error: "Buku tidak ditemukan." });
    }

    // Hapus Buku (Stok Otomatis Terhapus Karena Cascade)
    await prisma.book.delete({
      where: { id: bookId },
    });

    res.status(200).json({
      success: true,
      message: "Buku berhasil dihapus.",
    });
  } catch (error) {
    console.error("Anda tidak dapat menghapus buku:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Mengelola Stok Buku (Admin Only)
export const updateBookStock = async (req: Request, res: Response) => {
  try {
    const { bookId, storeId, stock } = req.body;

    if (!bookId || !storeId || stock === undefined) {
      return res.status(400).json({
        error: "Id buku, Id toko, dan ketersediaan stok tidak boleh kosong.",
      });
    }

    // Validasi Tipe Data
    const bookIdStr = String(bookId);
    const storeIdStr = String(storeId);
    const stockNum =
      typeof stock === "string" ? parseInt(stock) : Number(stock);

    // Perbarui Jika Sudah Ada, Buat Baru Jika Belum Ada
    const bookStock = await prisma.bookStock.upsert({
      where: {
        bookId_storeId: { bookId: bookIdStr, storeId: storeIdStr },
      },
      update: { stock: stockNum },
      create: {
        bookId: bookIdStr,
        storeId: storeIdStr,
        stock: stockNum,
      },
    });

    res.status(200).json({
      success: true,
      message: "Stok buku berhasil diperbarui.",
      stock: bookStock,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menambah atau mengurangi stok buku:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Mendapatkan Semua Stok Buku yang Ada Di Masing-Masing Toko Buku
export const getBookStock = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;

    // Validasi ID Buku
    const bookIdStr = getStringParam(bookId);
    if (!bookIdStr) {
      return res.status(400).json({ error: "ID buku tidak valid." });
    }

    const stocks = await prisma.bookStock.findMany({
      where: { bookId: bookIdStr },
      include: {
        store: true,
      },
    });

    res.status(200).json({
      success: true,
      stocks,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat fetch semua data stok buku di semua toko buku:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};
