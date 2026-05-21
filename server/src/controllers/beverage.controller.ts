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

// Validasi Kategori Minuman
const validCategories = ["COFFEE", "JUICE", "MILKSHAKE", "MINERAL"];

// Menangkap Semua Aneka Minuman yang Tersedia
export const getAllBeverages = async (req: Request, res: Response) => {
  try {
    const { category, isAvailable } = req.query;

    // Buat Filter
    const where: any = {};
    if (category && typeof category === "string") where.category = category;
    if (isAvailable === "true") where.isAvailable = true;
    if (isAvailable === "false") where.isAvailable = false;

    const beverages = await prisma.beverage.findMany({
      where,
      orderBy: { name: "asc" },
    });

    res.status(200).json({
      success: true,
      count: beverages.length,
      beverages,
    });
  } catch (error) {
    console.error("Anda tidak dapat fetch semua data minuman:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Menangkap Data Aneka Minuman Berdasarkan ID
export const getBeverageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const beverageId = getStringParam(id);

    if (!beverageId) {
      return res.status(400).json({ error: "ID minuman tidak valid." });
    }

    const beverage = await prisma.beverage.findUnique({
      where: { id: beverageId },
    });

    if (!beverage) {
      return res.status(404).json({ error: "Aneka minuman tidak ditemukan." });
    }

    res.status(200).json({
      success: true,
      beverage,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menangkap data minuman berdasarkan ID:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Membuat atau Menambahkan Aneka Minuman Baru (Admin Only)
export const createBeverage = async (req: Request, res: Response) => {
  try {
    const { name, price, category, image, isAvailable } = req.body;

    // Validasi Input
    if (!name || !price || !category) {
      return res.status(400).json({
        error: "Semua field tidak boleh ada yang kosong.",
      });
    }

    // Validasi Kategori
    if (!validCategories.includes(category.toUpperCase())) {
      return res.status(400).json({
        error: `Kategori tidak valid. Harus sesuai pada salah satu pilihan menu: ${validCategories.join(", ")}`,
      });
    }

    const beverage = await prisma.beverage.create({
      data: {
        name: String(name),
        price: typeof price === "string" ? parseFloat(price) : Number(price),
        category: category.toUpperCase() as any,
        image: image ? String(image) : null,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Minuman berhasil ditambahkan.",
      beverage,
    });
  } catch (error) {
    console.error("Anda tidak dapat menambahkan aneka minuman baru:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Memperbarui Aneka Minuman yang Tersedia (Admin Only)
export const updateBeverage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const beverageId = getStringParam(id);

    if (!beverageId) {
      return res.status(400).json({ error: "ID minuman tidak valid." });
    }

    const { name, price, category, image, isAvailable } = req.body;

    // Cek Apakah Minuman Ada
    const existingBeverage = await prisma.beverage.findUnique({
      where: { id: beverageId },
    });

    if (!existingBeverage) {
      return res.status(404).json({ error: "Minuman tidak ditemukan." });
    }

    // Validasi Kategori Jika Diperbarui
    let validCategory = existingBeverage.category;
    if (category) {
      if (!validCategories.includes(category.toUpperCase())) {
        return res.status(400).json({
          error: `Kategori tidak valid. Harus sesuai pada salah satu pilihan menu: ${validCategories.join(", ")}`,
        });
      }
      validCategory = category.toUpperCase() as any;
    }

    const updatedBeverage = await prisma.beverage.update({
      where: { id: beverageId },
      data: {
        name: name ? String(name) : existingBeverage.name,
        price: price
          ? typeof price === "string"
            ? parseFloat(price)
            : Number(price)
          : existingBeverage.price,
        category: validCategory,
        image:
          image !== undefined
            ? image
              ? String(image)
              : null
            : existingBeverage.image,
        isAvailable:
          isAvailable !== undefined
            ? Boolean(isAvailable)
            : existingBeverage.isAvailable,
      },
    });

    res.status(200).json({
      success: true,
      message: "Minuman berhasil diperbarui.",
      beverage: updatedBeverage,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat memperbarui detail dan informasi aneka minuman:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Menghapus Aneka Minuman dari Sistem (Admin Only)
export const deleteBeverage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const beverageId = getStringParam(id);

    if (!beverageId) {
      return res.status(400).json({ error: "ID minuman tidak valid" });
    }

    // Cek Apakah Minuman Ada
    const existingBeverage = await prisma.beverage.findUnique({
      where: { id: beverageId },
    });

    if (!existingBeverage) {
      return res.status(404).json({ error: "Minuman tidak ditemukan." });
    }

    await prisma.beverage.delete({
      where: { id: beverageId },
    });

    res.status(200).json({
      success: true,
      message: "Minuman berhasil dihapus.",
    });
  } catch (error) {
    console.error("Anda tidak dapat menghapus minuman:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
