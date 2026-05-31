"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { BookCategory, Genre, getCategoryLabel } from "@/lib/books";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImage: string;
  category: BookCategory;
  genre: Genre;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
}

// Helper: Format Harga
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("id-ID").format(price);
};

const BookCard = ({
  id,
  title,
  author,
  price,
  coverImage,
  category,
  // genre,
  rating = 0,
  reviewCount = 0,
  isNew = false,
  // isBestSeller = false,
}: BookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  if (!mounted) {
    return (
      <div className="group relative bg-base-100 rounded-xl overflow-hidden shadow-md">
        <div className="h-64 bg-base-200 animate-pulse" />
        <div className="p-4">
          <div className="h-5 bg-base-200 rounded animate-pulse w-3/4 mb-2" />
          <div className="h-4 bg-base-200 rounded animate-pulse w-1/2 mb-3" />
          <div className="flex items-center gap-1 mb-2">
            <div className="h-3 bg-base-200 rounded animate-pulse w-20" />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-200">
            <div className="h-6 bg-base-200 rounded animate-pulse w-16" />
            <div className="h-8 bg-base-200 rounded animate-pulse w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-base-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
    >
      <div className="absolute flex flex-col gap-2 top-3 left-3 z-10">
        {isNew && (
          <span className="px-3 py-1.5 bg-error/10 text-error text-xs font-bold rounded">
            NEW
          </span>
        )}
        <span
          className={`px-3 py-1.5 bg-base-100/80 text-base-content text-xs font-semibold rounded`}
        >
          {getCategoryLabel(category)}
        </span>
      </div>

      <button
        onClick={handleWishlist}
        className="absolute top-3 right-3 z-10 p-2 bg-black/30 backdrop-blur-xl rounded-full cursor-pointer"
      >
        <Heart
          size={18}
          className={`transition font-medium ${isWishlisted ? "fill-red-500 text-red-500" : "text-base-content"}`}
        />
      </button>

      <Link href={`/books/${id}`}>
        <div className="relative h-92 overflow-hidden bg-base-100">
          <Image
            src={coverImage || "/assets/uncovered-book.png"}
            alt={title}
            width={250}
            height={500}
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          <div className="absolute bottom-2 left-2 z-10">
            <Image
              src="/assets/best-seller.png"
              alt="best seller"
              width={36}
              height={36}
            />
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/books/${id}`}>
          <h3 className="font-bold text-base-content/70 line-clamp-1 hover:text-base-content transition">
            {title}
          </h3>
        </Link>
        <p className="text-sm font-medium text-base-content/50 mt-1">
          {author}
        </p>

        <div className="flex items-center font-medium gap-1 mt-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < Math.floor(rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-base-content"
                }
              />
            ))}
          </div>
          <span className="text-xs font-medium text-base-content/40 ml-1">
            ({reviewCount})
          </span>
        </div>

        <div className="flex items-center justify-between mt-5 pt-3 border-t border-base-content">
          <span className="text-xl font-extrabold text-base-content">
            Rp{formatPrice(price)}
          </span>
          <button className="btn btn-sm bg-base-content text-base-300 gap-1">
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>

      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-base-100 via-base-100 to-transparent"
        >
          <button className="btn btn-block gap-2">
            <ShoppingCart size={18} />
            Tambah ke Keranjang
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BookCard;
