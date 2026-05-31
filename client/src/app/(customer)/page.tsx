"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Book,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Coffee,
  CupSoda,
  LibraryBig,
  User,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import BookCard from "@/components/customer/BookCard";
import BookTypeGrid from "@/components/customer/BookTypeGrid";

interface FeaturedBook {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImage: string;
  category: "NOVEL" | "COMIC";
  genre:
    | "HORROR"
    | "COMEDY"
    | "ACTION"
    | "GORE"
    | "SLICE_OF_LIFE"
    | "ROMANCE"
    | "MYSTERY"
    | "PSYCOLOGY"
    | "FANTASY"
    | "MATURE";
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
}

// Dummy Data
const featuredBooks: FeaturedBook[] = [
  {
    id: "1",
    title: "Laut Bercerita",
    author: "Leila S. Chudori",
    price: 95000,
    coverImage: "/assets/uncovered-book.png",
    category: "NOVEL",
    genre: "SLICE_OF_LIFE",
    rating: 4.9,
    reviewCount: 2345,
    isBestSeller: true,
  },
  {
    id: "2",
    title: "One Piece Vol. 1",
    author: "Eiichiro Oda",
    price: 85000,
    coverImage: "/assets/uncovered-book.png",
    category: "COMIC",
    genre: "ACTION",
    rating: 4.9,
    reviewCount: 5678,
    isBestSeller: true,
  },
  {
    id: "3",
    title: "Nanti Kita Cerita Tentang Hari Ini",
    author: "Marchella FP",
    price: 85000,
    coverImage: "/assets/uncovered-book.png",
    category: "NOVEL",
    genre: "ROMANCE",
    rating: 4.7,
    reviewCount: 3456,
  },
  {
    id: "4",
    title: "Bumi Manusia",
    author: "Pramoedya Ananta Toer",
    price: 110000,
    coverImage: "/assets/uncovered-book.png",
    category: "NOVEL",
    genre: "ROMANCE",
    rating: 4.9,
    reviewCount: 4567,
    isBestSeller: true,
  },
  {
    id: "5",
    title: "Attack on Titan Vol. 1",
    author: "Hajime Isayama",
    price: 75000,
    coverImage: "/assets/uncovered-book.png",
    category: "COMIC",
    genre: "ACTION",
    rating: 4.8,
    reviewCount: 7890,
    isBestSeller: true,
  },
  {
    id: "6",
    title: "Sherlock Holmes",
    author: "Arthur Conan Doyle",
    price: 120000,
    coverImage: "/assets/uncovered-book.png",
    category: "NOVEL",
    genre: "MYSTERY",
    rating: 4.9,
    reviewCount: 6789,
  },
  {
    id: "7",
    title: "Jujutsu Kaisen Vol. 1",
    author: "Gege Akutami",
    price: 68000,
    coverImage: "/assets/uncovered-book.png",
    category: "COMIC",
    genre: "ACTION",
    rating: 4.8,
    reviewCount: 5432,
    isBestSeller: true,
  },
];

const CustomerHomePage = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft + container.clientWidth <
          container.scrollWidth - 10,
      );
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      checkScrollButtons();
      return () => container.removeEventListener("scroll", checkScrollButtons);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 280;
      const newScrollLeft =
        direction === "left"
          ? container.scrollLeft - scrollAmount
          : container.scrollLeft + scrollAmount;
      container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-8 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4">
                Temukan Dunia Buku dan Minuman dalam Nuansa Ketenangan
              </h1>

              <p className="text-base-content/70 mb-6 text-base md:text-lg max-w-3xl">
                Pesan buku favoritmu untuk pengalaman membaca yang berbeda di
                Fusion Heart sambil menikmati secangkir cokelat hangat dalam
                suasana yang tenang.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/books"
                  className="btn btn-sm md:btn-lg bg-base-300/50 hover:bg-base-300/30 text-base-content gap-2 text-sm md:text-lg"
                >
                  <BookOpen size={20} />
                  Belanja Sekarang
                </Link>
                <Link
                  href="/stores"
                  className="btn btn-sm md:btn-lg btn-outline gap-2 text-sm md:text-lg"
                >
                  <Coffee size={20} />
                  Cari Toko Terdekat
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 border-t pt-8 border-base-content/70">
                <div className="p-5 bg-base-100 shadow-xl flex flex-col gap-2 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1 justify-center">
                      <p className="text-sm font-medium text-base-content/70">
                        Buku Tersedia
                      </p>
                      <p className="text-4xl font-bold text-base-content">
                        50+
                      </p>
                    </div>
                    <LibraryBig size={36} className="text-base-content" />
                  </div>
                  <p className="text-xs text-base-content/70">
                    ↗︎ (12%) dari bulan lalu
                  </p>
                </div>
                <div className="p-5 bg-base-100 shadow-xl flex flex-col gap-2 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1 justify-center">
                      <p className="text-sm font-medium text-base-content/70">
                        Minuman Tersedia
                      </p>
                      <p className="text-4xl font-bold text-base-content">
                        20+
                      </p>
                    </div>
                    <CupSoda size={36} className="text-base-content" />
                  </div>
                  <p className="text-xs text-base-content/70">
                    ↗︎ (8%) dari bulan lalu
                  </p>
                </div>
                <div className="p-5 bg-base-100 shadow-xl flex flex-col gap-2 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1 justify-center">
                      <p className="text-sm font-medium text-base-content/70">
                        Pelanggan Puas
                      </p>
                      <p className="text-4xl font-bold text-base-content">
                        100K
                      </p>
                    </div>
                    <User size={36} className="text-base-content" />
                  </div>
                  <p className="text-xs text-base-content/70">
                    ↗︎ (30%) dari bulan lalu
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/assets/hero-section-image.png"
                  alt="Hero Image"
                  loading="eager"
                  width={800}
                  height={400}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute bottom-1 left-1 md:-bottom-6 md:-left-6 bg-base-100 rounded-xl shadow-lg p-4 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-base-content/10 rounded-full flex items-center justify-center">
                  <Coffee size={24} className="text-base-content" />
                </div>

                <div className="flex flex-col gap-1 justify-center">
                  <p className="font-bold text-sm md:text-base text-base-content">
                    Gratis 2 Cup Americano
                  </p>
                  <p className="text-xs md:text-sm text-base-content/70 font-semibold">
                    Minimal Pesanan Rp. 100K
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute top-1 right-1 md:-top-4 md:-right-4 bg-base-100 rounded-xl shadow-lg p-2 flex flex-col justify-center gap-3"
              >
                <div className="w-12 h-12 bg-base-content/10 rounded-full flex items-center justify-center">
                  <Book size={24} className="text-base-content" />
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <p className="font-semibold text-xs md:text-sm text-base-content">
                    Extra
                  </p>
                  <p className="font-medium text-xs md:text-sm text-error">
                    -30%
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <BookTypeGrid />

      {/* Featured Books Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-base-content">
                Buku Terlaris
              </h2>
              <p className="text-base-content/70 font-semibold">
                Pilihan buku terbaik bulanan yang paling banyak dibeli hingga
                bulan ini.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className={`p-2 rounded-full shadow-lg transition ${
                  canScrollLeft
                    ? "btn btn-ghost btn-circle cursor-pointer"
                    : "btn btn-ghost btn-circle opacity-80 cursor-not-allowed"
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className={`p-2 rounded-full shadow-lg transition ${
                  canScrollRight
                    ? "btn btn-ghost btn-circle cursor-pointer"
                    : "btn btn-ghost btn-circle opacity-80 cursor-not-allowed"
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {featuredBooks.map((book) => (
              <div key={book.id} className="min-w-62.5 w-62.5 shrink-0">
                <BookCard
                  id={book.id}
                  title={book.title}
                  author={book.author}
                  price={book.price}
                  coverImage={book.coverImage}
                  category={book.category}
                  genre={book.genre}
                  rating={book.rating}
                  reviewCount={book.reviewCount}
                  isNew={book.isNew}
                  isBestSeller={book.isBestSeller}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default CustomerHomePage;
