"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import { Mail, Lock, LogIn } from "lucide-react";
import Button from "@/components/common/Button";
import Link from "next/link";
import FloatingInput from "@/components/common/FloatingInput";
import LoadingProgress from "@/components/common/LoadingProgress";

interface AxiosError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
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

        toast.success("Login berhasil!");

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
      <LoadingProgress isLoading={isLoading} message="Memverifikasi akun..." />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          required
          icon={<Lock size={18} />}
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Lupa Password?
          </Link>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          fullWidth
          icon={<LogIn size={18} />}
        >
          Masuk
        </Button>
      </form>
    </>
  );
};

export default LoginPage;
