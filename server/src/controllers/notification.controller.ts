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

// Menerima Notifikasi
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Anda tidak dapat menerima notifikasi:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Tandai Satu Notifikasi Sudah Dibaca
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const notificationId = getStringParam(id);
    if (!notificationId) {
      return res.status(400).json({ error: "ID notifikasi tidak valid." });
    }

    // Cek Apakah Notifikasi Milik Pengguna yang Sedang Login
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notifikasi tidak ditemukan." });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: "Notifikasi telah ditandai sudah dibaca.",
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menandai notifikasi ini sebagai tanda sudah dibaca:",
      error,
    );
    res.status(500).json({ error: "Server Internal error." });
  }
};

// Tandai Semua Notifikasi Sudah Dibaca
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: `${result.count} notifikasi telah dibaca.`,
      count: result.count,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menandai semua notifikasi sudah dibaca:",
      error,
    );
    res.status(500).json({ error: "Server internal error." });
  }
};

// Buat Notifikasi (Tidak Diexport sebagai API)
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  metadata?: any,
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadata: metadata || {},
      },
    });

    console.log(`Notifikasi telah dibuat untuk ${userId}: ${title}.`);
    return notification;
  } catch (error) {
    console.error("Anda tidak dapat membuat notifikasi:", error);
    return null;
  }
};

// Menghapus Notifikasi
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const notificationId = getStringParam(id);
    if (!notificationId) {
      return res.status(400).json({ error: "ID notifikasi tidak valid." });
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notifikasi tidak ditemukan." });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.status(200).json({
      success: true,
      message: "Notifikasi berhasil dihapus.",
    });
  } catch (error) {
    console.error("Anda tidak dapat menghapus notifikasi:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};
