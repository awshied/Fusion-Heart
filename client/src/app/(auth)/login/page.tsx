"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import { Lock, LogIn, Mail } from "lucide-react";

import axiosInstance from "@/lib/axios";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import LoadingProgress from "@/components/common/LoadingProgress";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import FloatingInput from "@/components/common/FloatingInput";

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const loginSchema = z.object({
  email: z.string().email("Email tidak valid."),
  password: z.string().min(1, "Password tidak boleh kosong."),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/auth/login", data);

      if (response.data.success) {
        dispatch(
          setCredentials({
            user: response.data.user,
            token: response.data.token,
          }),
        );

        toast.success("Yeay, Anda berhasil login.");

        if (response.data.user.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else if (response.data.user.role === "DRIVER") {
          router.push("/driver/dashboard");
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      const err = error as AxiosError;
      toast.error(err.response?.data?.error || "Login gagal.");
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
          <div className="w-full max-w-xl">
            <div className="card bg-base-100 shadow-2xl relative">
              <div className="absolute top-4 right-4">
                <ThemeSwitcher />
              </div>
              <div className="card-body">
                <LoadingProgress
                  isLoading={isLoading}
                  message="Memverifikasi akun..."
                />

                <div className="flex flex-col items-center mb-4">
                  <Image
                    src="/assets/logo.png"
                    alt="logo"
                    width={82}
                    height={82}
                  />
                  <h1 className="text-2xl font-extrabold text-base-content text-center font-poppins mt-4">
                    Selamat Datang
                  </h1>
                  <p className="text-sm font-semibold text-base-content/70 text-center font-mona mt-2">
                    Selamat datang di{" "}
                    <span className="font-bold text-base-content">
                      Fusion Heart
                    </span>
                    . Silahkan masukkan alamat email dan password Anda agar
                    dapat mengakses website kami.
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

                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-base-content font-semibold hover:underline"
                    >
                      Lupa Password?
                    </Link>
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
                        <LogIn size={18} />
                        <span className="font-semibold">Masuk</span>
                      </div>
                    )}
                  </button>
                </form>

                <div className="flex items-center justify-center mt-6 pt-3 border-t border-base-content">
                  <p className="text-sm text-center text-base-content/70 font-medium">
                    Belum memiliki akun?
                    <Link
                      href="/register"
                      className="text-base-content font-bold hover:underline ml-0.5"
                    >
                      Daftar
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

export default LoginPage;
