import { v4 as uuidv4 } from "uuid";

// Generate ID untuk Pengguna Tamu
export const generateSessionId = (): string => {
  return `guest_${uuidv4()}`;
};

// Hitung Total Harga Produk dalam Keranjang
export const calculateCartTotal = (items: any[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// Keranjang Kadaluarsa (7 hari)
export const getCartExpiration = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
};

// Cek Apakah Keranjang Sudah Kadaluarsa
export const isCartExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};
