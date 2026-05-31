"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import { User, Mail, Lock, Phone, UserPlus } from "lucide-react";

import axiosInstance from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import LoadingProgress from "@/components/common/LoadingProgress";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import FloatingInput from "@/components/common/FloatingInput";
import PasswordStrength from "@/components/shared/layouts/PasswordStrength";

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
    password: z.string().min(8, "Password minimal 8 karakter."),
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
          "Yeay, Anda telah berhasil registrasi akun di website kami.",
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
      <div
        className="min-h-screen flex flex-col bg-base-200"
        suppressHydrationWarning
      >
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-3xl">
            <div className="card bg-base-100 shadow-2xl relative">
              <div className="absolute top-4 right-4">
                <ThemeSwitcher />
              </div>

              <div className="card-body">
                <LoadingProgress
                  isLoading={isLoading}
                  message="Membuat akun baru..."
                />

                <div className="flex flex-col items-center mb-4">
                  <Image
                    src="/assets/logo.png"
                    alt="logo"
                    width={82}
                    height={82}
                  />
                  <h1 className="text-2xl font-extrabold text-base-content text-center font-poppins mt-4">
                    Registrasi Akun
                  </h1>
                  <p className="text-sm font-semibold text-base-content/70 text-center font-mona mt-2">
                    Mohon agar Anda mengisi semua form yang tersedia untuk
                    proses pembuatan akun baru.
                  </p>
                  <div className="divider my-2" />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput
                      id="name"
                      name="name"
                      type="text"
                      label="Nama Lengkap"
                      required
                      icon={<User size={18} />}
                      error={errors.name?.message}
                      {...register("name")}
                    />

                    <FloatingInput
                      id="email"
                      name="email"
                      type="email"
                      label="Email"
                      required
                      icon={<Mail size={18} />}
                      error={errors.email?.message}
                      {...register("email")}
                    />
                  </div>

                  <FloatingInput
                    id="phone"
                    name="phone"
                    type="tel"
                    label="Nomor Telepon (Opsional)"
                    icon={<Phone size={18} />}
                    error={errors.phone?.message}
                    {...register("phone")}
                  />

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <FloatingInput
                      id="password"
                      name="password"
                      type="password"
                      label="Password"
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
                      label="Ulangi Password"
                      required
                      icon={<Lock size={18} />}
                      error={errors.confirmPassword?.message}
                      {...register("confirmPassword")}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-soft btn-md btn-block transition-all duration-200"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner" />
                    ) : (
                      <div className="inline-flex flex-row items-center justify-center gap-2">
                        <UserPlus size={18} />
                        <span className="font-semibold">Daftar Sekarang</span>
                      </div>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-center mt-6 pt-3 border-t border-base-content">
                  <p className="text-sm text-center text-base-content/70 font-medium">
                    Sudah memiliki akun?
                    <Link
                      href="/login"
                      className="text-base-content font-bold hover:underline ml-0.5"
                    >
                      Login
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
