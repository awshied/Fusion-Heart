"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = ({
  onSearch,
  placeholder = "Cari...",
  className = "",
}: SearchBarProps) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    try {
      const saved = localStorage.getItem("recentSearches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Gagal memuat pencarian:", error);
    }
  }, [mounted]);

  const saveSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    } catch (error) {
      console.error("Gagal menyimpan pencarian:", error);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    saveSearch(query);
    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/books?search=${encodeURIComponent(query)}`);
    }
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    saveSearch(term);
    if (onSearch) {
      onSearch(term);
    } else {
      router.push(`/books?search=${encodeURIComponent(term)}`);
    }
    setIsExpanded(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("recentSearches");
    } catch (error) {
      console.error("Gagal menghapus pencarian:", error);
    }
  };

  if (!mounted) {
    return <div className={`w-80 ${className}`} />;
  }

  if (!isMobile) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center border border-base-100 rounded-lg overflow-hidden bg-base-200">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 px-4 py-2.5 bg-transparent outline-none text-base-content placeholder:text-base-content/70"
          />
          <button onClick={handleSearch} className="btn btn-square transition">
            <Search size={18} />
          </button>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="btn btn-ghost transition"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {query.length === 0 && recentSearches.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-base-300 rounded-lg shadow-lg border border-base-100 z-50">
            <div className="p-2">
              <div className="flex justify-between items-center px-2 py-1">
                <span className="text-xs text-base-content/70">
                  Pencarian Terbaru
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="btn btn-xs btn-ghost hover:underline"
                >
                  Hapus
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentClick(term)}
                    className="btn btn-xs btn-circle transition"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="p-2 text-base-content/70 hover:text-base-content transition"
      >
        <Search size={20} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsExpanded(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-0 left-0 right-0 bg-base-100 z-50 p-4 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center border border-base-100 rounded-lg overflow-hidden bg-base-300">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 px-4 py-2.5 bg-transparent outline-none text-base-content placeholder:text-base-content/70"
                  />
                  <button
                    onClick={handleSearch}
                    className="btn btn-square transition"
                  >
                    <Search size={18} />
                  </button>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="btn btn-ghost transition"
                >
                  <X size={20} />
                </button>
              </div>

              {recentSearches.length > 0 && (
                <div className="mt-4 pt-2 border-t border-base-100">
                  <div className="flex justify-between items-center px-2 py-1">
                    <span className="text-xs text-base-content/70">
                      Pencarian Terbaru
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="btn btn-xs btn-ghost hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {recentSearches.map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRecentClick(term)}
                        className="btn btn-xs btn-circle transition"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
