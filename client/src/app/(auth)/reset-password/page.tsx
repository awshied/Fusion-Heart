"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import { Lock, KeyRound } from "lucide-react";
import FloatingInput from "@/components/common/FloatingInput";
import Button from "@/components/common/Button";
import LoadingProgress from "@/components/common/LoadingProgress";
import PasswordStrength from "@/components/shared/layouts/PasswordStrength";

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password tidak cocok",
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
        <Button
          variant="outline"
          onClick={() => router.push("/forgot-password")}
          fullWidth
        >
          Kirim Ulang Link Reset
        </Button>
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
        <Button
          variant="outline"
          onClick={() => router.push("/login")}
          fullWidth
        >
          Kembali ke Login
        </Button>
      </div>
    );
  }

  return (
    <>
      <LoadingProgress isLoading={isLoading} message="Mereset password..." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="text-center mb-4">
          <p className="text-sm text-base-content/60">
            Masukkan password baru untuk akun Anda.
          </p>
        </div>

        <FloatingInput
          id="newPassword"
          name="newPassword"
          type="password"
          label="Password Baru"
          placeholder="Buat password baru"
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
          placeholder="Ulangi password baru"
          required
          icon={<Lock size={18} />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          isLoading={isLoading}
          fullWidth
          icon={<KeyRound size={18} />}
        >
          Reset Password
        </Button>
      </form>
    </>
  );
};

const ResetPasswordPage = () => {
  return (
    <Suspense
      fallback={
        <div className="text-center py-8">
          <div className="loader mx-auto"></div>
          <p className="mt-4 text-base-content/60">Memuat...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
};
export default ResetPasswordPage;
