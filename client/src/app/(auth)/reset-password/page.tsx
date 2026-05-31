"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { z } from "zod";
import toast from "react-hot-toast";
import { Lock, KeyRound } from "lucide-react";

import { zodResolver } from "@hookform/resolvers/zod";
import axiosInstance from "@/lib/axios";
import FloatingInput from "@/components/common/FloatingInput";
import LoadingProgress from "@/components/common/LoadingProgress";
import PasswordStrength from "@/components/shared/layouts/PasswordStrength";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password tidak cocok.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const watchedPassword = watch("newPassword", "");

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Token tidak valid");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/auth/reset-password", {
        token,
        newPassword: data.newPassword,
      });

      if (response.data.success) {
        setIsSuccess(true);
        toast.success(
          "Password berhasil direset! Silakan login kembali dan tolong diingat password baru Anda dengan baik.",
        );
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (error) {
      const err = error as AxiosError;
      toast.error(err.response?.data?.error || "Gagal reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto">
          <KeyRound className="w-8 h-8 text-error" />
        </div>
        <h2 className="text-xl font-semibold">Token Tidak Valid</h2>
        <p className="text-base-content/60">
          Link reset password tidak valid atau sudah kadaluarsa.
        </p>

        <button
          className="btn btn-outline btn-md btn-block transition-all duration-200"
          onClick={() => router.push("/forgot-password")}
        >
          <span className="font-semibold">Kirim Ulang Link Reset</span>
        </button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-semibold">Password Berhasil Direset!</h2>
        <p className="text-base-content/60">
          Password Anda telah berhasil diubah. Silakan login dengan password
          baru Anda.
        </p>
        <button
          className="btn btn-outline btn-md btn-block transition-all duration-200"
          onClick={() => router.push("/login")}
        >
          <span className="font-semibold">Kembali ke Login</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen flex flex-col bg-base-200"
        suppressHydrationWarning
      >
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl">
            <div className="card bg-base-100 shadow-2xl relative">
              <div className="absolute top-4 right-4">
                <ThemeSwitcher />
              </div>
              <div className="card-body">
                <LoadingProgress
                  isLoading={isLoading}
                  message="Mereset password..."
                />
                <div className="flex flex-col items-center mb-4">
                  <Image
                    src="/assets/logo.png"
                    alt="logo"
                    width={82}
                    height={82}
                  />
                  <h1 className="text-2xl font-extrabold text-base-content text-center font-poppins mt-4">
                    Bikin Ulang Password
                  </h1>
                  <p className="text-sm font-semibold text-base-content/70 text-center font-mona mt-2">
                    Masukkan password baru untuk akun Anda.
                  </p>
                  <div className="divider my-2" />
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <FloatingInput
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    label="Password Baru"
                    required
                    icon={<Lock size={18} />}
                    error={errors.newPassword?.message}
                    {...register("newPassword")}
                  />

                  <PasswordStrength password={watchedPassword} />

                  <FloatingInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Konfirmasi Password Baru"
                    required
                    icon={<Lock size={18} />}
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-soft btn-md btn-block transition-all duration-200"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner" />
                    ) : (
                      <div className="inline-flex flex-row items-center justify-center gap-2">
                        <KeyRound size={18} />
                        <span className="font-semibold">Reset Password</span>
                      </div>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ResetPasswordPage = () => {
  return (
    <Suspense
      fallback={
        <div className="text-center py-8">
          <div className="loader mx-auto"></div>
          <p className="mt-4 text-base-content/70">Memuat...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
};
export default ResetPasswordPage;
