import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth.route";

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

app.use("/api", limiter);

app.use("/api/auth", authRoutes);

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

const PORT = process.env.PORT || 3000;

const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Fusion Heart Server is running!`);
      console.log(`📡 API URL: http://localhost: ${PORT}`);
      console.log(`❤️  Health check: http://localhost:${PORT}/heart`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
