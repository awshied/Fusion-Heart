"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import { User, Mail, Lock, Phone, UserPlus } from "lucide-react";
import FloatingInput from "@/components/common/FloatingInput";
import Button from "@/components/common/Button";
import PasswordStrength from "@/components/shared/layouts/PasswordStrength";
import LoadingProgress from "@/components/common/LoadingProgress";

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter."),
    email: z.string().email("Email tidak valid."),
    phone: z.string().optional(),
    password: z.string().min(6, "Password minimal 6 karakter."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok.",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/auth/register", {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "CUSTOMER",
      });

      if (response.data.success) {
        toast.success(
          "Registrasi berhasil! Silakan login untuk mengakses aplikasi kami.",
        );
        router.push("/login");
      }
    } catch (error) {
      const err = error as AxiosError;
      toast.error(err.response?.data?.error || "Registrasi gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingProgress isLoading={isLoading} message="Membuat akun baru..." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FloatingInput
          id="name"
          name="name"
          type="text"
          label="Nama Lengkap"
          placeholder="John Doe"
          required
          icon={<User size={18} />}
          error={errors.name?.message}
          {...register("name")}
        />

        <FloatingInput
          id="email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="user@example.com"
          required
          icon={<Mail size={18} />}
          error={errors.email?.message}
          {...register("email")}
        />

        <FloatingInput
          id="phone"
          name="phone"
          type="tel"
          label="Nomor Telepon (Opsional)"
          placeholder="08123456789"
          icon={<Phone size={18} />}
          error={errors.phone?.message}
          {...register("phone")}
        />

        <FloatingInput
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Buat password"
          required
          icon={<Lock size={18} />}
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordStrength password={watchedPassword} />

        <FloatingInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Konfirmasi Password"
          placeholder="Ulangi password"
          required
          icon={<Lock size={18} />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          isLoading={isLoading}
          fullWidth
          icon={<UserPlus size={18} />}
        >
          Daftar Sekarang
        </Button>
      </form>
    </>
  );
};

export default RegisterPage;
