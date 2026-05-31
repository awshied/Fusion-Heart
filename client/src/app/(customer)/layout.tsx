"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import CustomerNavbar from "@/components/customer/CustomerNavbar";
import CustomerFooter from "@/components/customer/CustomerFooter";
import { useAppSelector } from "@/store/hooks";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const isRedirecting = isAuthenticated && user?.role !== "CUSTOMER";

  useEffect(() => {
    if (isAuthenticated && user?.role !== "CUSTOMER") {
      if (user?.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (user?.role === "DRIVER") {
        router.push("/driver/dashboard");
      }
    }
  }, [isAuthenticated, user, router]);

  if (isRedirecting) return null;
  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <CustomerNavbar />
      <main className="grow pt-4 pb-12">{children}</main>
      <CustomerFooter />
    </div>
  );
}
