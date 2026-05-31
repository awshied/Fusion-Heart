export type BookCategory = "NOVEL" | "COMIC";
export type Genre =
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

// Helper: Menampilkan Label Genre yang Lebih Friendly
export const getGenreLabel = (genre: Genre): string => {
  const labels: Record<Genre, string> = {
    HORROR: "Horror",
    COMEDY: "Comedy",
    ACTION: "Action",
    GORE: "Gore",
    SLICE_OF_LIFE: "Slice of Life",
    ROMANCE: "Romance",
    MYSTERY: "Mystery",
    PSYCOLOGY: "Psychology",
    FANTASY: "Fantasy",
    MATURE: "Mature",
  };
  return labels[genre] || genre;
};

// Helper: Menampilkan Label Kategori
export const getCategoryLabel = (category: BookCategory): string => {
  return category === "NOVEL" ? "Novel" : "Komik";
};

// Helper: Warna Badge Genre
export const getGenreColor = (genre: Genre): string => {
  const colors: Record<Genre, string> = {
    HORROR: "bg-purple-500",
    COMEDY: "bg-yellow-500",
    ACTION: "bg-orange-500",
    GORE: "bg-red-600",
    SLICE_OF_LIFE: "bg-green-500",
    ROMANCE: "bg-pink-500",
    MYSTERY: "bg-indigo-500",
    PSYCOLOGY: "bg-teal-500",
    FANTASY: "bg-emerald-500",
    MATURE: "bg-gray-600",
  };
  return colors[genre] || "bg-base-200";
};
