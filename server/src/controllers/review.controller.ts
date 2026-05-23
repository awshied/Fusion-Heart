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

// Meninggalkan Review atau Ulasan pada Driver dan Isi Buku yang Diterima
export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { targetType, targetId, rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    // Validasi Input
    if (!targetType || !targetId || !rating) {
      return res.status(400).json({
        error: "Semua field tidak boleh ada yang kosong.",
      });
    }

    // Validasi Target
    if (!["BOOK", "DRIVER"].includes(targetType)) {
      return res.status(400).json({
        error:
          "Target harus terdiri dari buku yang dipesan atau kurir yang mengantar.",
      });
    }

    // Validasi Rating (1-5)
    const ratingNum =
      typeof rating === "string" ? parseInt(rating) : Number(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res
        .status(400)
        .json({ error: "Rating harus ada di antara 1 hingga 5." });
    }

    // Jika Target adalah Buku, Cek Apakah Buku Ada
    if (targetType === "BOOK") {
      const book = await prisma.book.findUnique({
        where: { id: String(targetId) },
      });
      if (!book) {
        return res.status(404).json({ error: "Buku tidak ditemukan." });
      }
    }

    // Jika Target adalah Kurir, Cek Apakah Kurir Ada
    if (targetType === "DRIVER") {
      const driver = await prisma.user.findFirst({
        where: {
          id: String(targetId),
          role: "DRIVER",
        },
      });
      if (!driver) {
        return res.status(404).json({ error: "Kurir tidak ditemukan." });
      }
    }

    // Cek Apakah Pengguna Sudah Pernah Meninggalkan Review pada Target Ini
    const existingReview = await prisma.review.findFirst({
      where: {
        targetType: targetType as any,
        targetId: String(targetId),
        customerId: userId,
      },
    });

    if (existingReview) {
      return res.status(409).json({
        error: "Anda sudah pernah meninggalkan ulasan pada target ini.",
      });
    }

    // Buat Review
    const review = await prisma.review.create({
      data: {
        rating: ratingNum,
        comment: comment ? String(comment) : null,
        targetType: targetType as any,
        targetId: String(targetId),
        customerId: userId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Review berhasil ditambahkan.",
      review,
    });
  } catch (error) {
    console.error("Anda tidak dapat meninggalkan ulasan:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Memuat Semua Review pada Buku
export const getBookReviews = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const bookIdStr = getStringParam(bookId);

    if (!bookIdStr) {
      return res.status(400).json({ error: "ID buku tidak valid." });
    }

    const reviews = await prisma.review.findMany({
      where: {
        targetType: "BOOK",
        targetId: bookIdStr,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Hitung Rata-Rata Rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviews,
    });
  } catch (error) {
    console.error("Anda tidak dapat fetch semua data review pada buku:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Memuat Semua Review pada Kurir
export const getDriverReviews = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const driverIdStr = getStringParam(driverId);

    if (!driverIdStr) {
      return res.status(400).json({ error: "ID kurir tidak valid." });
    }

    const reviews = await prisma.review.findMany({
      where: {
        targetType: "DRIVER",
        targetId: driverIdStr,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Hitung Rata-Rata Rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviews,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat fetch semua data review pada kurir:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Memperbarui Review atau Ulasan Terhadap Buku atau Kurir
export const updateReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    const reviewId = getStringParam(id);
    if (!reviewId) {
      return res.status(400).json({ error: "ID ulasan tidak valid." });
    }

    if (!rating && comment === undefined) {
      return res.status(400).json({ error: "Tidak ada yang diperbarui." });
    }

    // Cek Apakah Review Ada
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return res.status(404).json({ error: "Ulasan tidak ditemukan." });
    }

    // Cek Apakah Pengguna Adalah Pembuat Review
    if (existingReview.customerId !== userId) {
      return res
        .status(403)
        .json({ error: "Anda hanya dapat memperbarui ulasan Anda." });
    }

    // Validasi Rating Jika Diperbarui
    let ratingNum: number | undefined;
    if (rating) {
      ratingNum =
        typeof rating === "string" ? parseInt(rating) : Number(rating);
      if (ratingNum < 1 || ratingNum > 5) {
        return res
          .status(400)
          .json({ error: "Rating harus ada di rentang 1 sampai 5." });
      }
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: ratingNum ?? existingReview.rating,
        comment:
          comment !== undefined
            ? comment
              ? String(comment)
              : null
            : existingReview.comment,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Ulasan berhasil diperbarui",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Anda tidak dapat memperbarui ulasan Anda:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Menghapus Ulasan dari Buku atau Kurir
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const { id } = req.params;

    const reviewId = getStringParam(id);
    if (!reviewId) {
      return res.status(400).json({ error: "ID review tidak valid." });
    }

    // Cek Apakah Review Ada
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return res.status(404).json({ error: "Ulasan tidak ditemukan." });
    }

    // Cek Apakah Pengguna Adalah Pembuat Review atau Admin
    if (existingReview.customerId !== userId && userRole !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Anda hanya dapat menghapus ulasan Anda sendiri." });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.status(200).json({
      success: true,
      message: "Ulasan berhasil dihapus.",
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menghapus ulasan buku atau kurir yang pernah Anda berikan:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};
