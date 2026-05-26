"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import { Mail, Send } from "lucide-react";
import FloatingInput from "@/components/common/FloatingInput";
import Button from "@/components/common/Button";

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const forgotSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/forgot-password", { email: data.email });
      setIsSent(true);
      toast.success("Link reset password telah dikirim ke email Anda");
    } catch (error) {
      const err = error as AxiosError;
      toast.error(
        err.response?.data?.error || "Gagal mengirim link reset password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-semibold">Cek Email Anda</h2>
        <p className="text-base-content/60">
          Kami telah mengirimkan link reset password ke email Anda. Silakan cek
          inbox atau folder spam.
        </p>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/login")}
          fullWidth
        >
          Kembali ke Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-sm text-base-content/60">
          Masukkan email Anda, kami akan mengirimkan link untuk mereset password
          Anda.
        </p>
      </div>

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

      <Button
        type="submit"
        isLoading={isLoading}
        fullWidth
        icon={<Send size={18} />}
      >
        Kirim Link Reset
      </Button>
    </form>
  );
};

export default ForgotPasswordPage;
