import crypto from "crypto";
import { Request, Response } from "express";
import prisma from "../lib/database";
import { comparePassword, hashPassword } from "../lib/hash.utils";
import { generateToken } from "../lib/jwt.utils";
import { sendResetPasswordEmail } from "../lib/email";
import { logError, logInfo, logWarn } from "../lib/logger";

// Registrasi atau Membuat Akun Baru
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validasi Input
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Semua field tidak boleh kosong." });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Passwordnya minimal harus ada 8 karakter." });
    }

    // Cek Apakah User Sudah Ada
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ error: "Pengguna dengan email ini sudah terdaftar." });
    }

    // Hash Password
    const hashedPassword = await hashPassword(password);

    // Buat User Baru
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: "CUSTOMER",
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

    // Generate JWT
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message:
        "Registrasi berhasil. Anda dapat segera login untuk menjelajahi Fusion Heart.",
      user,
      token,
    });
  } catch (error) {
    console.error("Anda tidak dapat registrasi:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Login untuk Mengakses Website
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email dan password tidak boleh kosong." });
    }

    logInfo(`Pengguna dengan email ${email} mencoba login.`);

    // Cari User
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logWarn(`Pengguna dengan email ${email} tidak ditemukan.`);
      return res
        .status(401)
        .json({ error: "Email atau password tidak valid." });
    }

    // Verifikasi Password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: "Email atau password tidak valid." });
    }

    // Generate Token
    const token = generateToken(user.id, user.role);

    logInfo(
      `Pengguna dengan ID ${user.id} berhasil login sebagai ${user.role}.`,
    );

    res.status(200).json({
      message: "Yeay, Anda berhasil login.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Anda tidak dapat login:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Otorisasi Diri Sudah Terdaftar
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Pengguna tidak terdaftar." });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Anda tidak bisa mendapatkan pengguna:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Keluar dari Website
export const logout = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      message:
        "Logout berhasil, token Anda akan otomatis dihapus dari sistem kami.",
    });
  } catch (error) {
    console.error("Anda tidak dapat logout:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Lupa Password yang Telah Dibuat
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email tidak boleh kosong." });
    }

    // Cari User Berdasarkan Email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Untuk Keamanan, Tetap Beri Response Sukses Meskipun Email Tidak Ditemukan
    if (!user) {
      return res.status(200).json({
        message:
          "Jika email Anda sudah teregistrasi, maka Anda akan menerima link untuk reset password Anda.",
      });
    }

    // Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Simpan Token ke Database
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: resetExpires,
      },
    });

    // Kirim Email
    try {
      await sendResetPasswordEmail(email, resetToken);
    } catch (emailError) {
      console.error(
        "Email sudah dikirim tapi tidak dapat dilanjutkan:",
        emailError,
      );
    }

    res.status(200).json({
      message:
        "Jika email Anda sudah teregistrasi, maka Anda akan menerima link untuk reset password Anda.",
    });
  } catch (error) {
    console.error("Anda tidak dapat melupakan password yang Anda buat:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Mendapatkan Token Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token dan password baru harus tersedia." });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Passwordnya minimal harus ada 8 karakter." });
    }

    // Hash Token Untuk Dicocokkan Dengan Database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Cari User Dengan Token yang Valid dan Belum Expired
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: "Reset token tidak valid atau mungkin sudah kadaluarsa.",
      });
    }

    // Hash Password Baru
    const hashedPassword = await hashPassword(newPassword);

    // Update Password dan Hapus Token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.status(200).json({
      message:
        "Yeay, password Anda berhasil direset. Tolong diingat baik-baik agar Anda tidak merepotkan diri Anda di lain hari.",
    });
  } catch (error) {
    console.error("Token reset password Anda error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Mengganti Password Lama Dengan Password Baru
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Password saat ini dan password baru tidak boleh kosong.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password baru harus terdiri dari minimal 8 karakter.",
      });
    }

    // Cari User
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }

    // Verifikasi Current Password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Password saat ini salah." });
    }

    // Hash Password Baru
    const hashedPassword = await hashPassword(newPassword);

    // Update Password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      message:
        "Yeay, password berhasil diubah. Silahkan login menggunakan password baru Anda.",
    });
  } catch (error) {
    console.error("Anda tidak dapat mengubah password:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
