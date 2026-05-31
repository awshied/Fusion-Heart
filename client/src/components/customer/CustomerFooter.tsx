"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";

const footerLinks = {
  Perusahaan: [
    { label: "Tentang Kami", href: "/about" },
    { label: "Karir", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Press", href: "/press" },
  ],
  Bantuan: [
    { label: "FAQ", href: "/faq" },
    { label: "Pengiriman", href: "/shipping" },
    { label: "Pengembalian", href: "/returns" },
    { label: "Hubungi Kami", href: "/contact" },
  ],
  Legal: [
    { label: "Kebijakan Privasi", href: "/privacy" },
    { label: "Syarat & Ketentuan", href: "/terms" },
    { label: "Kebijakan Cookie", href: "/cookies" },
  ],
};

const CustomerFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-base-100/95 border-t border-base-content/70">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0">
          <div>
            <Link href="/" className="flex items-center shrink-0 mb-4">
              <Image src="/assets/logo.png" alt="logo" width={60} height={60} />
              <span className="text-3xl ml-3 font-poppins font-extrabold">
                Fusion Heart
              </span>
            </Link>
            <p className="text-base-content/60 mb-4 font-semibold max-w-md font-mona">
              Temukan buku favoritmu sambil menikmati secangkir kopi nikmat
              dalam suasana yang tenang.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base-content/60 font-semibold font-mona">
                <MapPin size={16} />
                <span className="text-sm">Jabodetabek, Indonesia</span>
              </div>
              <div className="flex items-center gap-2 text-base-content/60 font-semibold font-mona">
                <Mail size={16} />
                <span className="text-sm">
                  jabodetabekbookstore@fusionheart.com
                </span>
              </div>
              <div className="flex items-center gap-2 text-base-content/60 font-semibold font-mona">
                <Phone size={16} />
                <span className="text-sm">(+62) 21 1234 5678</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="font-bold text-base-content mb-4 font-poppins">
                  {category}
                </h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-base-content/60 font-mona font-semibold hover:text-base-content transition"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-base-content/70" />

        <div className="flex flex-col items-center justify-center font-mona">
          <p className="text-sm font-semibold text-base-content/70">
            © {currentYear} Fusion Heart. All rights reserved.
          </p>
          <p className="text-xs font-semibold text-base-content/50 mt-1">
            Dibuat dalam wilayah Jabodetabek
          </p>
        </div>
      </div>
    </footer>
  );
};

export default CustomerFooter;
