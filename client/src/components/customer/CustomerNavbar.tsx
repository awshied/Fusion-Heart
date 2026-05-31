"use client";

import { useAppSelector } from "@/store/hooks";
import {
  BookOpen,
  Gift,
  Heart,
  Home,
  Menu,
  ShoppingCart,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import SearchBar from "../shared/ui/SearchBar";
import ThemeSwitcher from "../common/ThemeSwitcher";
import ProfileDropdown from "./ProfileDropdown";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const CustomerNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const cartItemCount = useAppSelector((state) => state.cart.items.length);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  if (!mounted) {
    return <div className="h-16 bg-base-100" />;
  }

  const navLinks = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/books", label: "Buku", icon: BookOpen },
    { href: "/promos", label: "Promo", icon: Gift },
  ];

  const iconLinks = [
    { href: "/wishlist", label: "Wishlist", icon: Heart, count: 0 },
    { href: "/cart", label: "Cart", icon: ShoppingCart, count: cartItemCount },
  ];
  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${scrolled ? "bg-base-100/95 backdrop-blur-md shadow-md" : "bg-base-100 shadow-sm"}
        `}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center shrink-0">
              <Image src="/assets/logo.png" alt="logo" width={46} height={46} />
              <span className="text-xl ml-3 font-poppins font-extrabold">
                Fusion Heart
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    transition-colors font-medium
                    ${
                      pathname === link.href
                        ? "text-base-content border-b-2 border-base-content"
                        : "text-base-content/60 hover:text-base-content"
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:block flex-1 max-w-md mx-4">
              <SearchBar />
            </div>

            <div className="flex items-center space-x-2 md:space-x-3">
              {iconLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative btn btn-ghost btn-circle"
                >
                  <link.icon size={24} />
                  {link.count > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white font-bold text-xs rounded-full flex items-center justify-center">
                      {link.count > 9 ? "9+" : link.count}
                    </span>
                  )}
                </Link>
              ))}

              <ThemeSwitcher />

              {isAuthenticated ? (
                <ProfileDropdown />
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-base-content hover:bg-base-content/10 rounded-lg transition"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium bg-base-300/50 text-base-content rounded-lg hover:bg-base-300/30 transition"
                  >
                    Daftar
                  </Link>
                </div>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-base-content/60 hover:text-base-content transition rounded-lg hover:bg-base-200"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="h-16"></div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 bg-base-100 shadow-xl md:hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    pathname === link.href
                      ? "bg-base-content/10 text-base-content"
                      : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
                  }`}
                >
                  <link.icon size={18} />
                  <span>{link.label}</span>
                </Link>
              ))}

              <div className="border-t border-base-content my-2" />

              {iconLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-base-content/60 hover:bg-base-200 hover:text-base-content transition"
                >
                  <link.icon size={18} />
                  <span>{link.label}</span>
                  {link.count > 0 && (
                    <span className="ml-auto bg-error text-white font-bold text-xs px-2 py-0.5 rounded-full">
                      {link.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CustomerNavbar;
