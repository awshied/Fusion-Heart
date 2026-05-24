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

// Helper: Hitung Jarak Antar 2 Koordinat (Km)
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

// Memuat Semua Toko Buku yang Ada
export const getAllStores = async (req: Request, res: Response) => {
  try {
    const { city, province } = req.query;

    // Bangun Filter
    const where: any = {};
    if (city && typeof city === "string")
      where.city = { contains: city, mode: "insensitive" };
    if (province && typeof province === "string")
      where.province = { contains: province, mode: "insensitive" };

    const stores = await prisma.store.findMany({
      where,
      orderBy: { city: "asc" },
      include: {
        _count: {
          select: { books: true, tables: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: stores.length,
      stores,
    });
  } catch (error) {
    console.error("Anda tidak dapat fetch semua data toko buku:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Memuat Data Toko Buku Berdasarkan ID
export const getStoreById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = getStringParam(id);

    if (!storeId) {
      return res.status(400).json({ error: "ID toko tidak valid." });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        tables: {
          where: { isAvailable: true },
          orderBy: { tableNumber: "asc" },
        },
        books: {
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
          where: { stock: { gt: 0 } },
        },
      },
    });

    if (!store) {
      return res.status(404).json({ error: "Toko tidak ditemukan." });
    }

    res.status(200).json({
      success: true,
      store,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menangkap data toko berdasarkan ID:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Membuat atau Menambahkan Toko Buku Baru (Admin Only)
export const createStore = async (req: Request, res: Response) => {
  try {
    const { name, address, lat, lng, city, province } = req.body;

    // Validasi Input
    if (!name || !address || !lat || !lng || !city || !province) {
      return res.status(400).json({
        error: "Semua field wajib diisi.",
      });
    }

    const store = await prisma.store.create({
      data: {
        name: String(name),
        address: String(address),
        lat: typeof lat === "string" ? parseFloat(lat) : Number(lat),
        lng: typeof lng === "string" ? parseFloat(lng) : Number(lng),
        city: String(city),
        province: String(province),
      },
    });

    res.status(201).json({
      success: true,
      message: "Toko buku berhasil ditambahkan.",
      store,
    });
  } catch (error) {
    console.error("Anda tidak dapat menambahkan toko buku baru:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Memperbarui Toko yang Tersedia (Admin Only)
export const updateStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = getStringParam(id);

    if (!storeId) {
      return res.status(400).json({ error: "ID toko buku tidak valid." });
    }

    const { name, address, lat, lng, city, province } = req.body;

    // Cek Apakah Toko Buku SUdah Ada
    const existingStore = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!existingStore) {
      return res.status(404).json({ error: "Toko buku tidak ditemukan." });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        name: name ? String(name) : existingStore.name,
        address: address ? String(address) : existingStore.address,
        lat: lat
          ? typeof lat === "string"
            ? parseFloat(lat)
            : Number(lat)
          : existingStore.lat,
        lng: lng
          ? typeof lng === "string"
            ? parseFloat(lng)
            : Number(lng)
          : existingStore.lng,
        city: city ? String(city) : existingStore.city,
        province: province ? String(province) : existingStore.province,
      },
    });

    res.status(200).json({
      success: true,
      message: "Toko buku berhasil diperbarui.",
      store: updatedStore,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat memperbarui detail dan informasi toko buku:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Menghapus Toko Buku dari Sistem (Admin Only)
export const deleteStore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const storeId = getStringParam(id);

    if (!storeId) {
      return res.status(400).json({ error: "ID toko buku tidak valid." });
    }

    // Cek Apakah Toko Buku Sudah Ada
    const existingStore = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        books: { take: 1 },
        tables: { take: 1 },
        orders: { take: 1 },
      },
    });

    if (!existingStore) {
      return res.status(404).json({ error: "Toko buku tidak ditemukan." });
    }

    // Cek Apakah Toko Memiliki Relasi Data
    if (
      existingStore.books.length > 0 ||
      existingStore.tables.length > 0 ||
      existingStore.orders.length > 0
    ) {
      return res.status(400).json({
        error:
          "Tidak dapat menghapus toko yang memiliki ketersediaan buku dan pesanan oleh pelanggan.",
      });
    }

    await prisma.store.delete({
      where: { id: storeId },
    });

    res.status(200).json({
      success: true,
      message: "Toko buku berhasil dihapus.",
    });
  } catch (error) {
    console.error("Anda tidak dapat menghapus toko buku:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Mendapatkan Mana Jarak Toko Buku Terdekat
export const getNearestStores = async (req: Request, res: Response) => {
  try {
    const { lat, lng, limit = "10" } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Garis bujur dan garis lintang tidak boleh kosong." });
    }

    const customerLat = typeof lat === "string" ? parseFloat(lat) : Number(lat);
    const customerLng = typeof lng === "string" ? parseFloat(lng) : Number(lng);
    const limitNum =
      typeof limit === "string" ? parseInt(limit) : Number(limit);

    // Dapatkan Semua Toko Buku yang Ada
    const stores = await prisma.store.findMany();

    // Hitung Jarak (Rumus Haversine Sederhana)
    const storesWithDistance = stores.map((store) => {
      const distance = calculateDistance(
        customerLat,
        customerLng,
        store.lat,
        store.lng,
      );
      return { ...store, distance };
    });

    // Urutkan Berdasarkan Jarak Terdekat
    storesWithDistance.sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      success: true,
      count: Math.min(storesWithDistance.length, limitNum),
      stores: storesWithDistance.slice(0, limitNum),
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat fetch toko buku dari jarak terdekat:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};
