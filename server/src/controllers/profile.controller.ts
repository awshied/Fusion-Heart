import { Request, Response } from "express";
import prisma from "../lib/database";
import { deleteFromCloudinary, uploadToCloudinary } from "../lib/cloudinary";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Menangkap Profil Sendiri
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customerOrders: true,
            reviews: true,
            wishlist: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    // Tambahan Statistik untuk Kurir
    let driverStats = null;
    if (user.role === "DRIVER") {
      const completedOrders = await prisma.order.count({
        where: { driverId: userId, orderStatus: "COMPLETED" },
      });

      const averageRating = await prisma.review.aggregate({
        where: { targetType: "DRIVER", targetId: userId },
        _avg: { rating: true },
      });

      driverStats = {
        completedOrders,
        averageRating: averageRating._avg.rating || 0,
      };
    }

    // Tambahan Statistik untuk Customer
    let customerStats = null;
    if (user.role === "CUSTOMER") {
      const totalSpent = await prisma.order.aggregate({
        where: { customerId: userId, paymentStatus: "PAID" },
        _sum: { total: true },
      });

      customerStats = {
        totalOrders: user._count.customerOrders,
        totalSpent: totalSpent._sum.total || 0,
      };
    }

    res.status(200).json({
      success: true,
      profile: {
        ...user,
        driverStats,
        customerStats,
      },
    });
  } catch (error) {
    console.error("Anda tidak dapat memuat profil diri sendiri:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Memperbarui Profil (Nama dan Nomor Telepon)
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { name, phone } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const updateData: any = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length === 0) {
        return res.status(400).json({ error: "Nama tidak boleh kosong." });
      }
      if (trimmedName.length > 100) {
        return res
          .status(400)
          .json({ error: "Nama terlalu panjang (max 100 karakter)." });
      }
      updateData.name = trimmedName;
    }
    if (phone !== undefined) updateData.phone = phone ? String(phone) : null;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui.",
      profile: updatedUser,
    });
  } catch (error) {
    console.error("Anda tidak dapat memperbarui profil:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Unggah Foto Profil
export const uploadAvatar = async (req: MulterRequest, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Tidak ada file yang diunggah." });
    }

    // Hapus Avatar Lama Jika Ada
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (currentUser?.avatar) {
      const urlParts = currentUser.avatar.split("/");
      const filename = urlParts[urlParts.length - 1];
      const publicId = `avatars/${filename.split(".")[0]}`;

      try {
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.log("Tidak dapat menghapus avatar lama:", deleteError);
      }
    }

    const result = await uploadToCloudinary(req.file.buffer, "avatars");

    // Perbarui Pengguna dengan Avatar Baru
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: result.secure_url,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        role: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Foto profil berhasil diperbarui.",
      avatar: updatedUser.avatar,
      profile: updatedUser,
    });
  } catch (error) {
    console.error("Anda tidak dapat memperbarui foto profil Anda:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Hapus Foto Profil
export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Otentikasi terlebih dahulu." });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (currentUser?.avatar) {
      const urlParts = currentUser.avatar.split("/");
      const filename = urlParts[urlParts.length - 1];
      const publicId = `avatars/${filename.split(".")[0]}`;

      try {
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.log("Tidak dapat menghapus avatar:", deleteError);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });

    res.status(200).json({
      success: true,
      message: "Foto profil berhasil dihapus.",
    });
  } catch (error) {
    console.error("Anda tidak dapat menghapus foto profil Anda:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};
