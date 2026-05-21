import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dummySecretToken";

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
