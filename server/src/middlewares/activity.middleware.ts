import { Request, Response, NextFunction } from "express";
import prisma from "../lib/database";

// Helper: Mapping URL ke action
const getActionFromUrl = (method: string, url: string): string | null => {
  if (method === "GET") {
    if (url.startsWith("/api/books")) return "VIEW_PRODUCT";
    if (url.startsWith("/api/cart")) return "VIEW_CART";
    if (url.startsWith("/api/orders/my-orders")) return "VIEW_ORDERS";
    if (url === "/api/auth/me") return "VIEW_PROFILE";
    return "PAGE_VIEW";
  }

  if (method === "POST") {
    if (url.startsWith("/api/cart/add")) return "ADD_TO_CART";
    if (url.startsWith("/api/orders/checkout")) return "CHECKOUT";
    if (url.startsWith("/api/wishlist")) return "ADD_TO_WISHLIST";
    if (url === "/api/auth/login") return "LOGIN_ATTEMPT";
    if (url === "/api/auth/logout") return "LOGOUT";
    return null;
  }

  if (method === "DELETE") {
    if (url.startsWith("/api/cart")) return "REMOVE_FROM_CART";
    return null;
  }

  return null;
};

// Pantau Aktivitas Pengguna
export const trackActivity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = (req as any).user?.userId;

  // Hanya Track Jika Pengguna Login
  if (userId) {
    // Simpan Aktivitas Setelah Respons Selesai
    res.on("finish", async () => {
      const action = getActionFromUrl(req.method, req.url);

      if (action) {
        try {
          await prisma.userActivity.create({
            data: {
              userId,
              action,
              metadata: {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                query: req.query,
                body: req.method === "POST" ? req.body : undefined,
              },
              ipAddress: req.ip,
              userAgent: req.get("user-agent"),
            },
          });
        } catch (error) {
          console.error("Gagal memantau aktivitas pengguna:", error);
        }
      }
    });
  }

  next();
};
