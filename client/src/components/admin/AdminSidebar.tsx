"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Coffee,
  Store,
  Table2,
  Package,
  Users,
  Truck,
  Ticket,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/books", label: "Buku", icon: BookOpen },
  { href: "/admin/beverages", label: "Minuman", icon: Coffee },
  { href: "/admin/stores", label: "Toko", icon: Store },
  { href: "/admin/tables", label: "Meja", icon: Table2 },
  { href: "/admin/orders", label: "Pesanan", icon: Package },
  { href: "/admin/customers", label: "Customer", icon: Users },
  { href: "/admin/drivers", label: "Driver", icon: Truck },
  { href: "/admin/promos", label: "Promo", icon: Ticket },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-base-100 border-r border-base-200 transition-all duration-300 z-40 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-base-200">
        {isOpen ? (
          <span className="text-xl font-bold text-primary">Fusion Heart</span>
        ) : (
          <span className="text-xl font-bold text-primary">FH</span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-lg hover:bg-base-200 transition"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 px-4 py-3 transition ${
              pathname === item.href
                ? "bg-primary/10 text-primary border-r-2 border-primary"
                : "text-base-content/70 hover:bg-base-200"
            }`}
          >
            <item.icon size={20} />
            {isOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
