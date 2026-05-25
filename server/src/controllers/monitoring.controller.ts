import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import os from "os";

// Helper: Validasi ID
const getStringParam = (
  param: string | string[] | undefined,
): string | undefined => {
  if (typeof param === "string") return param;
  if (Array.isArray(param) && param.length > 0) return param[0];
  return undefined;
};

// Cek Sistem dapat Beroperasi
export const getHeart = async (req: Request, res: Response) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = os.loadavg();

    res.status(200).json({
      success: true,
      status: "healthy",
      uptime: {
        seconds: Math.floor(uptime),
        minutes: Math.floor(uptime / 60),
        hours: Math.floor(uptime / 3600),
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      },
      cpu: {
        loadAverage: cpuUsage,
        cpus: os.cpus().length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Anda tidak dapat cek sistem ini:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Memuat Beberapa File Log (Admin Only)
export const getLogFiles = async (req: Request, res: Response) => {
  try {
    const logsDir = path.join(process.cwd(), "logs");

    if (!fs.existsSync(logsDir)) {
      return res.status(200).json({ success: true, files: [] });
    }

    const files = fs.readdirSync(logsDir).map((file) => {
      const stats = fs.statSync(path.join(logsDir, file));
      return {
        name: file,
        size: `${Math.round(stats.size / 1024)} KB`,
        modified: stats.mtime,
      };
    });

    res.status(200).json({
      success: true,
      files,
    });
  } catch (error) {
    console.error("Anda tidak dapat memuat log:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Menangkap Konten Log (Admin Only)
export const getLogContent = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { lines = "100" } = req.query;

    // Validasi Nama File
    const filenameStr = getStringParam(filename);
    if (!filenameStr) {
      return res.status(400).json({ error: "Nama file tidak valid." });
    }

    const safeFilename = path.basename(filenameStr);
    const logsDir = path.join(process.cwd(), "logs");
    const filePath = path.join(logsDir, safeFilename);

    if (!filePath.startsWith(logsDir)) {
      return res.status(403).json({ error: "Akses Ditolak." });
    }

    // Cek Apakah File Ada
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Log file tidak ditemukan." });
    }

    // Baca File
    const content = fs.readFileSync(filePath, "utf-8");
    const linesArray = content.split("\n").filter((line) => line.trim());
    const linesToShow = parseInt(lines as string) || 100;
    const lastLines = linesArray.slice(
      -Math.min(linesToShow, linesArray.length),
    );

    res.status(200).json({
      success: true,
      filename: safeFilename,
      totalLines: linesArray.length,
      showing: lastLines.length,
      content: lastLines.join("\n"),
    });
  } catch (error) {
    console.error("Anda tidak dapat memuat konten log:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Memuat Metrik Sistem (Admin Only)
export const getSystemMetrics = async (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    res.status(200).json({
      success: true,
      metrics: {
        memory: {
          total: `${Math.round(totalMem / 1024 / 1024 / 1024)} GB`,
          free: `${Math.round(freeMem / 1024 / 1024 / 1024)} GB`,
          usedPercent: `${Math.round(((totalMem - freeMem) / totalMem) * 100)}%`,
          process: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          },
        },
        cpu: {
          loadAverage: {
            "1min": cpuUsage[0].toFixed(2),
            "5min": cpuUsage[1].toFixed(2),
            "15min": cpuUsage[2].toFixed(2),
          },
          cores: os.cpus().length,
        },
        uptime: {
          system: `${Math.floor(os.uptime() / 3600)} jam, ${Math.floor((os.uptime() % 3600) / 60)} menit`,
          process: `${Math.floor(process.uptime() / 3600)} jam, ${Math.floor((process.uptime() % 3600) / 60)} menit`,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Anda tidak dapat memuat metrik sistem:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};
