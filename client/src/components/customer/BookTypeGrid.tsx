import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import novelIcon from "../../../public/assets/novel.png";
import comicIcon from "../../../public/assets/comic.png";
import horrorIcon from "../../../public/assets/horror.png";
import comedyIcon from "../../../public/assets/comedy.png";
import actionIcon from "../../../public/assets/action.png";
import goreIcon from "../../../public/assets/gore.png";
import solIcon from "../../../public/assets/slice-of-life.png";
import romanceIcon from "../../../public/assets/romance.png";
import mysteryIcon from "../../../public/assets/mystery.png";
import psychologyIcon from "../../../public/assets/psychology.png";
import fantasyIcon from "../../../public/assets/fantasy.png";
import matureIcon from "../../../public/assets/mature.png";
import Link from "next/link";
import Image from "next/image";

const genreAndCategories = [
  {
    name: "Novel",
    value: "NOVEL",
    href: "/books?category=NOVEL",
    icon: novelIcon,
  },
  {
    name: "Komik",
    value: "COMIC",
    href: "/books?category=COMIC",
    icon: comicIcon,
  },
  {
    name: "Horror",
    value: "HORROR",
    href: "/books?genre=HORROR",
    icon: horrorIcon,
  },
  {
    name: "Komedi",
    value: "COMEDY",
    href: "/books?genre=COMEDY",
    icon: comedyIcon,
  },
  {
    name: "Aksi",
    value: "ACTION",
    href: "/books?genre=ACTION",
    icon: actionIcon,
  },
  {
    name: "Gore",
    value: "GORE",
    href: "/books?genre=GORE",
    icon: goreIcon,
  },
  {
    name: "Slice of Life",
    value: "SLICE_OF_LIFE",
    href: "/books?genre=SLICE_OF_LIFE",
    icon: solIcon,
  },
  {
    name: "Romantis",
    value: "ROMANCE",
    href: "/books?genre=ROMANCE",
    icon: romanceIcon,
  },
  {
    name: "Misteri",
    value: "MYSTERY",
    href: "/books?genre=MYSTERY",
    icon: mysteryIcon,
  },
  {
    name: "Psikologi",
    value: "PSYCOLOGY",
    href: "/books?genre=PSYCOLOGY",
    icon: psychologyIcon,
  },
  {
    name: "Fantasi",
    value: "FANTASY",
    href: "/books?genre=FANTASY",
    icon: fantasyIcon,
  },
  {
    name: "Dewasa",
    value: "MATURE",
    href: "/books?genre=MATURE",
    icon: matureIcon,
  },
];

const BookTypeGrid = () => {
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
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-base-content">
              Jelajahi Seleramu
            </h2>
            <p className="text-base-content/70 font-semibold">
              Tentukan kategori dan genre buku kesukaanmu untuk mendapatkan
              pengalaman yang dapat dikenang bersama teman-temanmu.
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
          className="inline-flex gap-6 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {genreAndCategories.map((type, index) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              className="group overflow-hidden min-h-42 h-42 shrink-0 transition-all duration-300"
            >
              <Link
                href={type.href}
                className="flex flex-col items-center justify-center gap-y-4 space-x-4 group cursor-pointer"
              >
                <Image
                  src={type.icon}
                  alt={type.name}
                  width={120}
                  height={120}
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                <h3 className="text-base-content font-semibold text-lg mr-2">
                  {type.name}
                </h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookTypeGrid;
