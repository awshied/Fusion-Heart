"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import toast from "react-hot-toast";
import { LogIn, Mail, Send } from "lucide-react";

import axiosInstance from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import FloatingInput from "@/components/common/FloatingInput";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const forgotSchema = z.object({
  email: z.string().email("Email yang Anda masukkan tidak valid."),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

const ForgotPasswordPage = () => {
  const router = useRouter();
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
      toast.success("Link reset password telah dikirim ke email Anda.");
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
        <h2 className="text-xl font-bold text-base-content">Cek Email Anda</h2>
        <p className="text-base-content/70 font-semibold">
          Kami telah mengirimkan link reset password ke email Anda. Silakan cek
          inbox atau folder spam.
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
                <div className="flex flex-col items-center mb-4">
                  <LogIn size={46} />
                  <h1 className="text-2xl font-extrabold text-base-content text-center font-poppins mt-4">
                    Lupa Password
                  </h1>
                  <p className="text-sm font-semibold text-base-content/70 text-center font-mona mt-2">
                    Masukkan{" "}
                    <span className="font-bold text-base-content">email </span>
                    Anda, kami akan mengirimkan link untuk mereset{" "}
                    <span className="font-bold text-base-content">
                      password{" "}
                    </span>
                    Anda.
                  </p>
                  <div className="divider my-2" />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-soft btn-md btn-block transition-all duration-200"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner" />
                    ) : (
                      <div className="inline-flex flex-row items-center justify-center gap-2">
                        <Send size={18} />
                        <span className="font-semibold">Kirim Link Reset</span>
                      </div>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-center mt-6 pt-3 border-t border-base-content">
                  <p className="text-sm text-center text-base-content/70 font-medium">
                    Ingat password?
                    <Link
                      href="/login"
                      className="text-base-content font-bold hover:underline ml-0.5"
                    >
                      Kembali ke Login
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

export default ForgotPasswordPage;
