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

// Memuat Data Pesanan yang Diterima
export const getMyAssignedOrders = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.userId;

    if (!driverId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const orders = await prisma.order.findMany({
      where: {
        driverId: driverId,
        orderStatus: { in: ["ASSIGNED", "PROCESSING"] },
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        store: {
          select: { id: true, name: true, address: true, lat: true, lng: true },
        },
        items: {
          where: { itemType: "BOOK" },
          select: { name: true, quantity: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Anda tidak dapat memuat pesanan yang diterima:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Memuat Riwayat Pesanan yang Sudah Selesai
export const getMyOrderHistory = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.userId;

    if (!driverId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const orders = await prisma.order.findMany({
      where: {
        driverId: driverId,
        orderStatus: "COMPLETED",
      },
      include: {
        customer: {
          select: { name: true, phone: true },
        },
        store: {
          select: { name: true, address: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat memuat riwayat pesanan yang Anda terima:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};

// Menerima Pesanan dari Admin
export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.userId;
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

    if (order.driverId !== driverId) {
      return res
        .status(403)
        .json({ error: "Pesanan ini tidak diberikan untuk Anda." });
    }

    if (order.orderStatus !== "ASSIGNED") {
      return res
        .status(400)
        .json({ error: "Pesanan tidak dapat diterima dalam status saat ini." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: "PROCESSING" },
    });

    res.status(200).json({
      success: true,
      message: "Pesanan berhasil diterima.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Anda tidak dapat menerima pesanan:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Ambil Pesanan dari Toko Buku
export const pickUpOrder = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.userId;
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

    if (order.driverId !== driverId) {
      return res
        .status(403)
        .json({ error: "Pesanan ini tidak diberikan untuk Anda." });
    }

    if (order.orderStatus !== "PROCESSING") {
      return res
        .status(400)
        .json({ error: "Pesanan tidak dapat diterima dalam status saat ini." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: "COMPLETED" },
    });

    res.status(200).json({
      success: true,
      message: "Pesanan berhasil diambil.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Anda tidak dapat mengambil pesanan pelanggan:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Perbarui Lokasi Kurir saat Tengan Mengirim Pesanan Pelanggan
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user?.userId;
    const { orderId, lat, lng } = req.body;

    if (!orderId || !lat || !lng) {
      return res
        .status(400)
        .json({ error: "Semua field tidak boleh ada yang kosong." });
    }

    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
    });

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    if (order.driverId !== driverId) {
      return res
        .status(403)
        .json({ error: "Pesanan ini tidak diberikan pada Anda." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: String(orderId) },
      data: {
        driverLat: typeof lat === "string" ? parseFloat(lat) : lat,
        driverLng: typeof lng === "string" ? parseFloat(lng) : lng,
      },
    });

    res.status(200).json({
      success: true,
      message: "Lokasi berhasil diperbarui.",
      location: { lat: updatedOrder.driverLat, lng: updatedOrder.driverLng },
    });
  } catch (error) {
    console.error("Anda tidak dapat memperbarui lokasi Anda:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Mendapatkan Statistik Kurir (Admin Only)
export const getDriverStats = async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const driverIdStr = getStringParam(driverId);

    if (!driverIdStr) {
      return res.status(400).json({ error: "ID kurir tidak valid." });
    }

    // Total Pesanan yang Sudah Dikirim
    const completedOrders = await prisma.order.count({
      where: {
        driverId: driverIdStr,
        orderStatus: "COMPLETED",
      },
    });

    // Pesanan yang Masih Ada Saat Ini
    const activeOrders = await prisma.order.count({
      where: {
        driverId: driverIdStr,
        orderStatus: { in: ["ASSIGNED", "PROCESSING"] },
      },
    });

    // Rata-Rata Rating dan Review dari Pelanggan
    const reviews = await prisma.review.aggregate({
      where: {
        targetType: "DRIVER",
        targetId: driverIdStr,
      },
      _avg: { rating: true },
      _count: true,
    });

    // Informasi Kurir
    const driver = await prisma.user.findUnique({
      where: { id: driverIdStr },
      select: { name: true, email: true, phone: true, createdAt: true },
    });

    res.status(200).json({
      success: true,
      stats: {
        driver: driver,
        totalCompletedOrders: completedOrders,
        activeOrders: activeOrders,
        averageRating: reviews._avg.rating || 0,
        totalReviews: reviews._count,
      },
    });
  } catch (error) {
    console.error("Anda tidak dapat meninjau statistik kurir:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};
