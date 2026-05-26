"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import DriverNavbar from "@/components/driver/DriverNavbar";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "DRIVER") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-base-200">
      <DriverNavbar />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
