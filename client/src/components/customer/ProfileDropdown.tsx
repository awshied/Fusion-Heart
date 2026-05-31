"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Heart,
  LogOut,
  Package,
  Settings,
  User,
  UserCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ProfileDropdown = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
    setIsOpen(false);
  };

  const menuItems = [
    { href: "/profile", label: "Profil Saya", icon: UserCircle },
    { href: "/orders", label: "Pesanan Saya", icon: Package },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
    { href: "/profile/settings", label: "Pengaturan", icon: Settings },
  ];
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-lg btn-circle transition"
      >
        {user?.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-base-100/10 flex items-center justify-center">
            <User size={16} className="text-base-100" />
          </div>
        )}
        <ChevronDown
          size={14}
          className={`text-base-content/70 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 bg-base-300 rounded-xl shadow-lg border border-base-100 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-base-100 bg-base-300">
              <p className="font-semibold text-base-content">{user?.name}</p>
              <p className="text-xs text-base-content/50">{user?.email}</p>
            </div>

            <div className="py-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-base-content/70 hover:bg-base-200 transition"
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="border-t border-base-100" />

            <button
              onClick={handleLogout}
              className="btn btn-block btn-sm btn-error transition"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
