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

// Fetch Semua Data Promo yang Tersedia
export const getActivePromos = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const promos = await prisma.promo.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { validUntil: "asc" },
    });

    res.status(200).json({
      success: true,
      count: promos.length,
      promos,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat memuat semua data promo yang tersedia:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};

// Validasi Kode Promo Sebelum Checkout
export const validatePromo = async (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || subtotal === undefined) {
      return res
        .status(400)
        .json({ error: "Kode promo dan subtotal harus ada." });
    }

    const promo = await prisma.promo.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      return res.status(404).json({ error: "Kode promo tidak valid." });
    }

    const now = new Date();

    // Cek Apakah Promo Aktif
    if (!promo.isActive) {
      return res.status(400).json({ error: "Kode promo tidak aktif." });
    }

    // Cek Masa Berlaku
    if (promo.validFrom > now || promo.validUntil < now) {
      return res.status(400).json({ error: "Kode promo sudah kadaluarsa." });
    }

    // Cek Limit Penggunaan
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return res
        .status(400)
        .json({ error: "Kode promo telah mencapai batas penggunaan." });
    }

    // Cek Minimal Pembelian
    if (promo.minPurchase && subtotal < promo.minPurchase) {
      return res.status(400).json({
        error: `Mininal pembelian untuk menggunakan promo ini adalah sebesar Rp.${promo.minPurchase.toLocaleString()}.`,
      });
    }

    // Hitung Diskon
    let discount = 0;
    if (promo.discountType === "PERCENTAGE") {
      discount = subtotal * (promo.discountValue / 100);
      if (promo.maxDiscount && discount > promo.maxDiscount) {
        discount = promo.maxDiscount;
      }
    } else {
      discount = promo.discountValue;
    }

    await prisma.promo.update({
      where: { code: code.toUpperCase() },
      data: { usageCount: { increment: 1 } },
    });

    res.status(200).json({
      success: true,
      promo: {
        code: promo.code,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount: Math.round(discount),
        maxDiscount: promo.maxDiscount,
        minPurchase: promo.minPurchase,
      },
    });
  } catch (error) {
    console.error("Anda tidak ada memvalidasi promo yang tersedia:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Fetch Semua Data Promo yang Tersedia (Admin Only)
export const getAllPromos = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;

    const where: any = {};
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;

    const promos = await prisma.promo.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      count: promos.length,
      promos,
    });
  } catch (error) {
    console.error("Anda tidak dapat memuat semua promo yang tersedia:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Fetch Data Promo Berdasarkan ID (Admin Only)
export const getPromoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promoId = getStringParam(id);

    if (!promoId) {
      return res.status(400).json({ error: "ID promo tidak valid." });
    }

    const promo = await prisma.promo.findUnique({
      where: { id: promoId },
    });

    if (!promo) {
      return res.status(404).json({ error: "Promo tidak ditemukan." });
    }

    res.status(200).json({
      success: true,
      promo,
    });
  } catch (error) {
    console.error("Anda tidak dapat memuat data promo berdasarkan ID:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Tambah Promo Baru (Admin Only)
export const createPromo = async (req: Request, res: Response) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      isActive,
    } = req.body;

    // Validasi Dasar
    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({
        error: "Semua field tidak boleh ada yang kosong.",
      });
    }

    // Validasi Tipe Diskon
    if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
      return res.status(400).json({ error: "Tipe diskon tidak valid." });
    }

    // Validasi Nilai Diskon
    const discountVal =
      typeof discountValue === "string"
        ? parseFloat(discountValue)
        : discountValue;
    if (discountVal <= 0) {
      return res
        .status(400)
        .json({ error: "Nilai diskon harus lebih tinggi dari 0" });
    }

    if (discountType === "PERCENTAGE" && discountVal > 100) {
      return res
        .status(400)
        .json({ error: "Persentase diskon tidak boleh melampaui 100%" });
    }

    // Validate date range
    const validFromDate = new Date(validFrom);
    const validUntilDate = new Date(validUntil);

    if (validFromDate >= validUntilDate) {
      return res
        .status(400)
        .json({ error: "validFrom harus lebih awal dari validUntil." });
    }

    // Cek Apakah Kode Promo Sudah Ada
    const existingPromo = await prisma.promo.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingPromo) {
      return res.status(409).json({ error: "Kode promo ini sudah ada." });
    }

    const promo = await prisma.promo.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        discountType: discountType as any,
        discountValue: discountVal,
        minPurchase: minPurchase
          ? typeof minPurchase === "string"
            ? parseFloat(minPurchase)
            : minPurchase
          : null,
        maxDiscount: maxDiscount
          ? typeof maxDiscount === "string"
            ? parseFloat(maxDiscount)
            : maxDiscount
          : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        usageLimit: usageLimit
          ? typeof usageLimit === "string"
            ? parseInt(usageLimit)
            : usageLimit
          : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Promo berhasil ditambahkan.",
      promo,
    });
  } catch (error) {
    console.error("Anda tidak dapat menambahkan kode promo baru:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Perbarui Kode Promo yang Sudah Ada (Admin Only)
export const updatePromo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promoId = getStringParam(id);

    if (!promoId) {
      return res.status(400).json({ error: "ID promo tidak valid." });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      isActive,
    } = req.body;

    const existingPromo = await prisma.promo.findUnique({
      where: { id: promoId },
    });

    if (!existingPromo) {
      return res.status(404).json({ error: "Promo tidak ditemukan." });
    }

    // Jika Mengganti Kode Promo, Cek Duplikasi
    if (code && code.toUpperCase() !== existingPromo.code) {
      const duplicatePromo = await prisma.promo.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (duplicatePromo) {
        return res.status(409).json({ error: "Kode promo ini sudah ada." });
      }
    }

    const updateData: any = {};
    if (code) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (discountType) updateData.discountType = discountType;
    if (discountValue)
      updateData.discountValue =
        typeof discountValue === "string"
          ? parseFloat(discountValue)
          : discountValue;
    if (minPurchase !== undefined)
      updateData.minPurchase = minPurchase
        ? typeof minPurchase === "string"
          ? parseFloat(minPurchase)
          : minPurchase
        : null;
    if (maxDiscount !== undefined)
      updateData.maxDiscount = maxDiscount
        ? typeof maxDiscount === "string"
          ? parseFloat(maxDiscount)
          : maxDiscount
        : null;
    if (validFrom) updateData.validFrom = new Date(validFrom);
    if (validUntil) updateData.validUntil = new Date(validUntil);
    if (usageLimit !== undefined)
      updateData.usageLimit = usageLimit
        ? typeof usageLimit === "string"
          ? parseInt(usageLimit)
          : usageLimit
        : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedPromo = await prisma.promo.update({
      where: { id: promoId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Promo berhasil diperbarui.",
      promo: updatedPromo,
    });
  } catch (error) {
    console.error("Anda tidak dapat memperbarui kode promo:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Hapus Kode Promo yang Tersedia (Admin Only)
export const deletePromo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promoId = getStringParam(id);

    if (!promoId) {
      return res.status(400).json({ error: "ID promo tidak valid." });
    }

    const existingPromo = await prisma.promo.findUnique({
      where: { id: promoId },
    });

    if (!existingPromo) {
      return res.status(404).json({ error: "Promo tidak ditemukan." });
    }

    await prisma.promo.delete({
      where: { id: promoId },
    });

    res.status(200).json({
      success: true,
      message: "Promo berhasil dihapus.",
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menghapus kode promo yang tersedia:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};
