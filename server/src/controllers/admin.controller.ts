import { Request, Response } from "express";
import prisma from "../lib/database";
import { hashPassword } from "../lib/hash.utils";

// Helper: Validasi ID
const getStringParam = (
  param: string | string[] | undefined,
): string | undefined => {
  if (typeof param === "string") return param;
  if (Array.isArray(param) && param.length > 0) return param[0];
  return undefined;
};

// Menangkap Semua Data Kurir
export const getAllDrivers = async (req: Request, res: Response) => {
  try {
    const { isActive, search } = req.query;

    const where: any = { role: "DRIVER" };

    if (isActive === "true") {
      // Bisa ditambahkan field isActive nanti jika perlu
    }

    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const drivers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            driverOrders: {
              where: { orderStatus: "COMPLETED" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Hitung Average Rating untuk Setiap Kurir
    const driversWithRating = await Promise.all(
      drivers.map(async (driver) => {
        const reviews = await prisma.review.aggregate({
          where: {
            targetType: "DRIVER",
            targetId: driver.id,
          },
          _avg: { rating: true },
          _count: true,
        });

        return {
          ...driver,
          averageRating: reviews._avg.rating || 0,
          totalReviews: reviews._count,
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: driversWithRating.length,
      drivers: driversWithRating,
    });
  } catch (error) {
    console.error("Anda tidak dapat memuat semua data kurir:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Menangkap Informasi Kurir Berdasarkan ID
export const getDriverById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = getStringParam(id);

    if (!driverId) {
      return res.status(400).json({ error: "ID kurir tidak valid." });
    }

    const driver = await prisma.user.findUnique({
      where: { id: driverId, role: "DRIVER" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        driverOrders: {
          include: {
            customer: {
              select: { name: true, phone: true },
            },
            store: {
              select: { name: true, address: true, city: true },
            },
            items: {
              where: { itemType: "BOOK" },
              select: { name: true, quantity: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ error: "Kurir tidak ditemukan." });
    }

    // Hitung Rating
    const reviews = await prisma.review.aggregate({
      where: {
        targetType: "DRIVER",
        targetId: driverId,
      },
      _avg: { rating: true },
      _count: true,
    });

    // Statistik Order
    const totalOrders = await prisma.order.count({
      where: { driverId: driverId },
    });

    const completedOrders = await prisma.order.count({
      where: { driverId: driverId, orderStatus: "COMPLETED" },
    });

    const pendingOrders = await prisma.order.count({
      where: {
        driverId: driverId,
        orderStatus: { in: ["ASSIGNED", "PROCESSING"] },
      },
    });

    res.status(200).json({
      success: true,
      driver: {
        ...driver,
        stats: {
          totalOrders,
          completedOrders,
          pendingOrders,
          averageRating: reviews._avg.rating || 0,
          totalReviews: reviews._count,
        },
      },
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat memuat informasi kurir berdasarkan ID:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};

// Meregistrasi Kurir Baru
export const createDriver = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Semua field tidak boleh ada yang kosong." });
    }

    // Cek Apakah Email Sudah Terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email sudah teregistrasi." });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Passwordnya minimal harus ada 8 karakter." });
    }

    const hashedPassword = await hashPassword(password);

    const driver = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: "DRIVER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Kurir berhasil diregistrasi",
      driver,
      temporaryPassword: password,
    });
  } catch (error) {
    console.error("Anda tidak dapat meregistrasi kurir baru:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Memperbarui Data Kurir
export const updateDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = getStringParam(id);

    if (!driverId) {
      return res.status(400).json({ error: "ID kurir tidak valid." });
    }

    const { name, phone, password } = req.body;

    // Cek Apakah Kurir Ada
    const existingDriver = await prisma.user.findFirst({
      where: { id: driverId, role: "DRIVER" },
    });

    if (!existingDriver) {
      return res.status(404).json({ error: "Kurir tidak ditemukan." });
    }

    const updateData: any = {};
    if (name) updateData.name = String(name);
    if (phone) updateData.phone = String(phone);
    if (password) {
      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Passwordnya minimal harus ada 8 karakter." });
      }
      updateData.password = await hashPassword(password);
    }

    const updatedDriver = await prisma.user.update({
      where: { id: driverId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Kurir berhasil diperbarui.",
      driver: updatedDriver,
    });
  } catch (error) {
    console.error("Anda tidak dapat memperbarui informasi kurir:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Pecat Kurir!!!
export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = getStringParam(id);

    if (!driverId) {
      return res.status(400).json({ error: "ID kurir tidak valid." });
    }

    // Cek Apakah Kurir Ada
    const existingDriver = await prisma.user.findFirst({
      where: { id: driverId, role: "DRIVER" },
      include: {
        driverOrders: {
          where: {
            orderStatus: { in: ["ASSIGNED", "PROCESSING"] },
          },
          take: 1,
        },
      },
    });

    if (!existingDriver) {
      return res.status(404).json({ error: "Kurir tidak ditemukan." });
    }

    // Cek Apakah Kurir Memiliki Pesanan Aktif
    if (existingDriver.driverOrders.length > 0) {
      return res.status(400).json({
        error: "Tidak dapat menghapus kurir yang masih memiliki pesanan aktif.",
      });
    }

    await prisma.user.delete({
      where: { id: driverId },
    });

    res.status(200).json({
      success: true,
      message: "Kurir telah dipecat.",
    });
  } catch (error) {
    console.error("Anda tidak dapat menghapus kurir:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Fetch Semua Data Pesanan
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status, orderType, storeId, limit = "50" } = req.query;

    const where: any = {};
    if (status && typeof status === "string") where.orderStatus = status;
    if (orderType && typeof orderType === "string") where.orderType = orderType;
    if (storeId && typeof storeId === "string") where.storeId = storeId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        store: true,
        driver: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: typeof limit === "string" ? parseInt(limit) : Number(limit),
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Anda tidak dapat fetch semua data pesanan:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Memberi Notifikasi pada Kurir
export const assignDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;
    const orderId = getStringParam(id);

    if (!orderId) {
      return res.status(400).json({ error: "ID pesanan tidak valid." });
    }

    if (!driverId) {
      return res.status(400).json({ error: "ID kurir harus ada." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    if (order.orderType !== "DELIVERY") {
      return res.status(400).json({
        error:
          "Hanya pesanan yang diantar ke lokasi pelanggan saja yang dapat dilakukan oleh kurir.",
      });
    }

    // Cek Kurir
    const driver = await prisma.user.findFirst({
      where: {
        id: String(driverId),
        role: "DRIVER",
      },
    });

    if (!driver) {
      return res.status(404).json({ error: "Kurir tidak ditemukan." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId: String(driverId),
        orderStatus: "ASSIGNED",
      },
    });

    res.status(200).json({
      success: true,
      message: "Kurir berhasil menyetujuinya.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Anda tidak dapat mengkonfirmasi pada kurir:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Memperbarui Status Pesanan
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    const orderId = getStringParam(id);

    if (!orderId) {
      return res.status(400).json({ error: "ID pesanan tidak valid." });
    }

    const validStatuses = [
      "PENDING",
      "ASSIGNED",
      "PROCESSING",
      "COMPLETED",
      "CANCELLED",
    ];
    if (!orderStatus || !validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        error: `Status pesanan harus meliputi salah satu dari ${validStatuses.join(", ")} agar valid.`,
      });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: orderStatus as any },
    });

    res.status(200).json({
      success: true,
      message: "Status pesanan diperbarui.",
      order,
    });
  } catch (error) {
    console.error("Anda tidak dapat memperbarui status pesanan:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Fetch Data Dashboard dalam Admin Panel
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Total Pendapatan
    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        orderStatus: "COMPLETED",
      },
      select: { total: true, createdAt: true },
    });

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );

    const monthlyRevenue = paidOrders
      .filter((order) => order.createdAt >= startOfMonth)
      .reduce((sum, order) => sum + order.total, 0);

    const yearlyRevenue = paidOrders
      .filter((order) => order.createdAt >= startOfYear)
      .reduce((sum, order) => sum + order.total, 0);

    // Jumlah Pesanan
    const totalOrders = await prisma.order.count();
    const pendingOrders = await prisma.order.count({
      where: { orderStatus: "PENDING" },
    });
    const processingOrders = await prisma.order.count({
      where: { orderStatus: "PROCESSING" },
    });
    const completedOrders = await prisma.order.count({
      where: { orderStatus: "COMPLETED" },
    });

    // Pesanan Bulanan (6 Bulan Terakhir)
    const monthlyOrders = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i + 1,
        0,
      );

      const count = await prisma.order.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      monthlyOrders.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        year: monthStart.getFullYear(),
        orders: count,
      });
    }

    // Buku yang Paling Laku
    const orderItems = await prisma.orderItem.groupBy({
      by: ["itemId", "name"],
      where: { itemType: "BOOK" },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    res.status(200).json({
      success: true,
      stats: {
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
          yearly: yearlyRevenue,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
        },
        monthlyOrders,
        topBooks: orderItems.map((item) => ({
          id: item.itemId,
          name: item.name,
          totalSold: item._sum.quantity || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Anda tidak dapat meninjau data dashboard:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};
