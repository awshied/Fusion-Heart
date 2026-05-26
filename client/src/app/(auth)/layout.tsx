"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getTitle = () => {
    if (pathname === "/login") return "Masuk ke Akun";
    if (pathname === "/register") return "Daftar Akun Baru";
    if (pathname === "/forgot-password") return "Lupa Password";
    if (pathname === "/reset-password") return "Reset Password";
    return "Fusion Heart";
  };

  const getSubtitle = () => {
    if (pathname === "/login") return "Belum punya akun?";
    if (pathname === "/register") return "Sudah punya akun?";
    if (pathname === "/forgot-password") return "Ingat password?";
    return "";
  };

  const getLinkText = () => {
    if (pathname === "/login") return "Daftar";
    if (pathname === "/register") return "Masuk";
    if (pathname === "/forgot-password") return "Kembali ke Login";
    return "";
  };

  const getLinkHref = () => {
    if (pathname === "/login") return "/register";
    if (pathname === "/register") return "/login";
    if (pathname === "/forgot-password") return "/login";
    return "";
  };

  return (
    <div className="min-h-screen flex flex-col" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Fusion</span>
          <span className="text-2xl font-bold">Heart</span>
          <span className="text-primary">❤️</span>
        </Link>
        <ThemeSwitcher />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-primary font-lobster">
                  {getTitle()}
                </h1>
                <div className="divider my-2"></div>
              </div>
              {children}
              {getSubtitle() && (
                <div className="text-center mt-6 pt-4 border-t border-base-200">
                  <p className="text-sm text-base-content/60">
                    {getSubtitle()}{" "}
                    <Link
                      href={getLinkHref()}
                      className="text-primary hover:underline font-medium"
                    >
                      {getLinkText()}
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-base-content/40">
        <p>© 2024 Fusion Heart - Where stories and souls meet ❤️</p>
      </footer>
    </div>
  );
}
