import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

export const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

let isCleaningUp = false;

const cleanup = async () => {
  if (isCleaningUp) return;
  isCleaningUp = true;

  try {
    await prisma.$disconnect();
    await pool.end();
  } catch (err) {
    // ignore error jika sudah di-end
  }
};

process.on("beforeExit", cleanup);
process.on("exit", cleanup);

export default prisma;
