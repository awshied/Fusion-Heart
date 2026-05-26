import type { Metadata, Viewport } from "next";
import { Mona_Sans, Poppins, Lobster_Two } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const monaSans = Mona_Sans({
  subsets: ["latin"],
  variable: "--font-mona-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const lobster = Lobster_Two({
  subsets: ["latin"],
  variable: "--font-lobster",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fusion Heart",
  description:
    "Toko buku dan kopi terbaik di Jabodetabek. Beli buku, pesan minuman, dan booking meja untuk nongkrong bersama teman-temanmu.",
  keywords: "toko buku, kopi, jabodetabek, buku online, cafe buku",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fef3e4" },
    { media: "(prefers-color-scheme: dark)", color: "#1c150d" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-theme="retro" suppressHydrationWarning>
      <body
        className={`${monaSans.variable} ${poppins.variable} ${lobster.variable} font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
