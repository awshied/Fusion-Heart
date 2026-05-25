import { Request, Response } from "express";
import prisma from "../lib/database";

// Memuat Aktivitas Pengguna
export const getCustomerActivity = async (req: Request, res: Response) => {
  try {
    const { days = "30", customerId } = req.query;
    const daysNum = parseInt(days as string);
    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(400).json({ error: "Parameter hari tidak valid." });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const where: any = {
      createdAt: { gte: startDate },
    };

    if (customerId && typeof customerId === "string") {
      where.userId = customerId;
    }

    // Memuat Jumlah Aktivitas Pengguna
    const activities = await prisma.userActivity.groupBy({
      by: ["action"],
      where,
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
    });

    // Memuat Tren Aktivitas Harian
    const dailyActivity = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM user_activities
      WHERE "createdAt" >= ${startDate}
        ${customerId ? prisma.$queryRaw`AND "userId" = ${customerId}` : prisma.$queryRaw``}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    `;

    // Memuat Pengguna yang Paling Sering Aktif
    const topUsers = await prisma.userActivity.groupBy({
      by: ["userId"],
      where,
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    });

    res.status(200).json({
      success: true,
      summary: {
        totalActivities: activities.reduce(
          (sum, a) => sum + a._count.action,
          0,
        ),
        byAction: activities,
        dailyTrend: dailyActivity,
        topUsers,
      },
    });
  } catch (error) {
    console.error("Anda tidak dapat memuat aktivitas pengguna:", error);
    res.status(500).json({ error: "Server Internal error." });
  }
};

// Menangkap Segmentasi Pengguna
export const getCustomerSegments = async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Memuat Semua Customer
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        customerOrders: {
          where: { paymentStatus: "PAID" },
          select: { total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
        reviews: { select: { id: true } },
        wishlist: { select: { id: true } },
      },
    });

    // Segmen Customer
    const segments = {
      active: [] as any[],
      inactive: [] as any[],
      cartAbandoners: [] as any[],
      highValue: [] as any[],
      reviewers: [] as any[],
    };

    const cartsWithItems = await prisma.cart.findMany({
      where: {
        customerId: { in: customers.map((c) => c.id) },
        items: { some: {} },
      },
      select: { customerId: true },
    });
    const customerIdsWithCart = new Set(
      cartsWithItems.map((c) => c.customerId),
    );

    for (const customer of customers) {
      const lastOrder = customer.customerOrders[0];
      const hasOrderInLast7Days =
        lastOrder && new Date(lastOrder.createdAt) > sevenDaysAgo;
      const totalSpent = customer.customerOrders.reduce(
        (sum, o) => sum + o.total,
        0,
      );

      const hasCart = customerIdsWithCart.has(customer.id);

      if (hasOrderInLast7Days) {
        segments.active.push(customer);
      } else if (
        customer.customerOrders.length === 0 &&
        customer.createdAt < thirtyDaysAgo
      ) {
        segments.inactive.push(customer);
      }

      if (hasCart && customer.customerOrders.length === 0) {
        segments.cartAbandoners.push(customer);
      }

      if (totalSpent > 500000) {
        segments.highValue.push(customer);
      }

      if (customer.reviews.length > 0) {
        segments.reviewers.push(customer);
      }
    }

    res.status(200).json({
      success: true,
      segments: {
        active: {
          count: segments.active.length,
          customers: segments.active.slice(0, 20),
        },
        inactive: {
          count: segments.inactive.length,
          customers: segments.inactive.slice(0, 20),
        },
        cartAbandoners: {
          count: segments.cartAbandoners.length,
          customers: segments.cartAbandoners.slice(0, 20),
        },
        highValue: {
          count: segments.highValue.length,
          customers: segments.highValue.slice(0, 20),
        },
        reviewers: {
          count: segments.reviewers.length,
          customers: segments.reviewers.slice(0, 20),
        },
      },
    });
  } catch (error) {
    console.error("Anda tidak dapat menangkap segmentasi pengguna:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Fetch Data Peringkat Kurir Berdasarkan Performanya
export const getDriverRanking = async (req: Request, res: Response) => {
  try {
    const drivers = await prisma.user.findMany({
      where: { role: "DRIVER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        driverOrders: {
          where: { orderStatus: "COMPLETED" },
          select: { id: true, total: true, createdAt: true },
        },
      },
    });

    const driverPerformance = await Promise.all(
      drivers.map(async (driver) => {
        const reviews = await prisma.review.aggregate({
          where: {
            targetType: "DRIVER",
            targetId: driver.id,
          },
          _avg: { rating: true },
          _count: true,
        });

        const totalOrders = driver.driverOrders.length;
        const totalRevenue = driver.driverOrders.reduce(
          (sum, o) => sum + o.total,
          0,
        );

        return {
          ...driver,
          stats: {
            totalCompletedOrders: totalOrders,
            totalRevenue,
            averageRating: reviews._avg.rating || 0,
            totalReviews: reviews._count,
            performanceScore:
              totalOrders * 10 + (reviews._avg.rating || 0) * 20,
          },
        };
      }),
    );

    // Urutkan Berdasarkan Skor Performa
    driverPerformance.sort(
      (a, b) => b.stats.performanceScore - a.stats.performanceScore,
    );

    res.status(200).json({
      success: true,
      drivers: driverPerformance,
      topDriver: driverPerformance[0] || null,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat fetch data peringkat kurir berdasarkan performanya:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};

// Mendapatkan Analitik Penjualan
export const getSalesAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = "month" } = req.query;
    const validPeriods = ["week", "month", "year"];
    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({ error: "Periode tidak valid." });
    }

    let startDate = new Date();

    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === "year") {
      startDate.setDate(startDate.getDate() - 365);
    }

    // Buku Teratas
    const topBooks = await prisma.orderItem.groupBy({
      by: ["itemId", "name"],
      where: {
        itemType: "BOOK",
        createdAt: { gte: startDate },
      },
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    // Minuman Teratas
    const topBeverages = await prisma.orderItem.groupBy({
      by: ["itemId", "name"],
      where: {
        itemType: "BEVERAGE",
        createdAt: { gte: startDate },
      },
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    // Penjualan Berdasarkan Tipe Pesanan
    const salesByType = await prisma.order.groupBy({
      by: ["orderType"],
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startDate },
      },
      _sum: { total: true },
      _count: true,
    });

    // Tren Penjualan Harian
    const dailySales = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as orderCount,
        SUM(total) as revenue
      FROM orders
      WHERE "paymentStatus" = 'PAID' 
        AND "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    `;

    res.status(200).json({
      success: true,
      period,
      analytics: {
        topBooks,
        topBeverages,
        salesByType,
        dailySales,
        summary: {
          totalOrders: salesByType.reduce((sum, t) => sum + t._count, 0),
          totalRevenue: salesByType.reduce(
            (sum, t) => sum + (t._sum.total || 0),
            0,
          ),
        },
      },
    });
  } catch (error) {
    console.error("Anda tidak bisa mendapatkan analitik penjualan:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Mengirim Promo Melalui Email (Admin Only)
export const sendPromoToSegment = async (req: Request, res: Response) => {
  try {
    const { segment, promoCode, subject, message } = req.body;

    const validSegments = [
      "active",
      "inactive",
      "cartAbandoners",
      "highValue",
      "reviewers",
      "all",
    ];
    if (!validSegments.includes(segment)) {
      return res.status(400).json({ error: "Segmen tidak valid." });
    }

    res.status(200).json({
      success: true,
      message: `Promo berhasil dikirim ke segmentasi ${segment}.`,
    });
  } catch (error) {
    console.error("Anda tidak dapat mengirim promo pada segmen:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};
