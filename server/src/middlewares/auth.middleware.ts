import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.utils";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token tidak tersedia." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res
        .status(401)
        .json({ error: "Token tidak valid atau mungkin sudah kadaluwarsa." });
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Tidak terotorisasi." });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ error: "Butuh izin dari pihak terkait." });
    }

    next();
  };
};
