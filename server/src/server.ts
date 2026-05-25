import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import http from "http";

dotenv.config();

import prisma from "./lib/database";
import { setupSocketIO } from "./lib/socket";
import {
  logErrorMiddleware,
  logRequest,
} from "./middlewares/logging.middleware";
import { trackActivity } from "./middlewares/activity.middleware";
import { requestLogger } from "./lib/logger";

import monitoringRoutes from "./routes/monitoring.route";
import authRoutes from "./routes/auth.route";
import profileRoutes from "./routes/profile.route";
import adminRoutes from "./routes/admin.route";
import driverRoutes from "./routes/driver.route";
import storeRoutes from "./routes/store.route";
import bookRoutes from "./routes/book.route";
import beverageRoutes from "./routes/beverage.route";
import tableRoutes from "./routes/table.route";
import wishlistRoutes from "./routes/wishlist.route";
import cartRoutes from "./routes/cart.route";
import reviewRoutes from "./routes/review.route";
import orderRoutes from "./routes/order.route";
import promoRoutes from "./routes/promo.route";
import paymentRoutes from "./routes/payment.route";
import notificationRoutes from "./routes/notification.route";
import analyticRoutes from "./routes/analytic.route";

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Terlalu banyak permintaan, coba lagi nanti." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(logRequest);
app.use(requestLogger);
app.use(trackActivity);

app.use("/api", limiter);

app.use("/api/payments", paymentRoutes);

app.use("/api/monitoring", monitoringRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/beverages", beverageRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticRoutes);

app.get("/api/heart", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API Endpoint Fusion Heart dapat beroperasi!",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route tidak ditemukan." });
});

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: err.message || "Server internal error.",
    });
  },
);

app.use(logErrorMiddleware);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    const server = http.createServer(app);
    const io = setupSocketIO(server);

    server.listen(PORT, () => {
      console.log(
        `✔️  Yeay, server Fusion Heart dapat berjalan di port: ${PORT}`,
      );
      console.log(
        `✅ Supabase berhasil terkonseksi: ${process.env.DIRECT_URL}`,
      );
    });

    process.on("SIGINT", () => {
      console.log("Mematikan server...");
      server.close(() => {
        console.log("Server ditutup.");
        prisma
          .$disconnect()
          .then(() => {
            console.log("Database terputus.");
            process.exit(0);
          })
          .catch((err) => {
            console.error("Gagal memutuskan database:", err);
            process.exit(1);
          });
      });
    });
  } catch (error) {
    console.error("❌ Gagal menjalankan server:", error);
    process.exit(1);
  }
};

startServer();
