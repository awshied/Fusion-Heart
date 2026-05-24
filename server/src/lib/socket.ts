import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../lib/database";

interface LocationData {
  orderId: string;
  lat: number;
  lng: number;
}

interface UserSocket {
  userId: string;
  role: string;
  socketId: string;
}

// Koneksi Aktif
const activeDrivers: Map<string, UserSocket> = new Map();
const activeCustomers: Map<string, UserSocket> = new Map();
const orderTracking: Map<string, string> = new Map();

let ioInstance: SocketServer | null = null;

export const setupSocketIO = (server: HttpServer) => {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  ioInstance = io;

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("Environment variabel untuk jwt sangat dibutuhkan.");
  }

  // Middleware: Koneksi Socket Otentikasi
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Otentikasi terlebih dahulu."));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (!decoded || !decoded.userId) {
        return next(new Error("Token tidak valid."));
      }

      // Verifikasi Role Pengguna
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true },
      });

      if (!user || user.role !== decoded.role) {
        return next(new Error("Role tidak valid."));
      }

      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch (error) {
      next(new Error("Otentikasi gagal."));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    console.log(
      `Pengguna terkoneksi: ${userId} (${role}) - Socket: ${socket.id}`,
    );

    // Registrasi Pengguna Berdasarkan Role Masing-Masing
    if (role === "DRIVER") {
      activeDrivers.set(userId, { userId, role, socketId: socket.id });
      console.log(
        `Kurir ${userId} online saat ini. Total kurir yang aktif: ${activeDrivers.size}.`,
      );

      socket.on("driver:join-orders", async (orderIds: string[]) => {
        for (const orderId of orderIds) {
          socket.join(`order:${orderId}`);
          orderTracking.set(orderId, userId);
          console.log(`Driver ${userId} tracking order ${orderId}`);
        }
      });

      socket.on("driver:location-update", async (data: LocationData) => {
        const { orderId, lat, lng } = data;

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { driverId: true },
        });

        if (!order) {
          console.log(
            `Pesanan ${orderId} tidak ditemukan di lokasi yang telah diperbarui.`,
          );
          return;
        }

        if (order?.driverId !== userId) {
          console.log(
            `Lokasi diperbarui oleh kurir yang tidak terotorisasi ${userId} untuk pesanan ${orderId}.`,
          );
          return;
        }

        await prisma.order.update({
          where: { id: orderId },
          data: {
            driverLat: lat,
            driverLng: lng,
          },
        });

        socket.to(`order:${orderId}`).emit("driver:location-changed", {
          orderId,
          lat,
          lng,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `Kurir ${userId} baru saja memperbarui lokasi untuk pesanan ${orderId}: (${lat}, ${lng}).`,
        );
      });

      socket.on("driver:offline", () => {
        activeDrivers.delete(userId);
        console.log(`Kurir ${userId} telah offline.`);
      });
    } else if (role === "CUSTOMER") {
      activeCustomers.set(userId, { userId, role, socketId: socket.id });
      console.log(
        `Pelanggan ${userId} baru saja online kembali. Total pelanggan: ${activeCustomers.size}.`,
      );

      socket.on("customer:track-order", async (orderId: string) => {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: {
            customerId: true,
            driverId: true,
            driverLat: true,
            driverLng: true,
          },
        });

        if (!order) {
          console.log(`Pesanan ${orderId} tidak dapat dilacak.`);
          socket.emit("error", { message: "Pesanan tidak ditemukan." });
          return;
        }

        if (order.customerId !== userId) {
          console.log(
            `Pelacakan telah dilakukan oleh pelanggan yang tidak terotorisasi ${userId} untuk pesanan ${orderId}.`,
          );
          socket.emit("error", {
            message: "Anda tidak terotorisasi untuk melacak pesanan ini.",
          });
          return;
        }

        socket.join(`order:${orderId}`);

        if (order.driverLat && order.driverLng) {
          socket.emit("driver:location-changed", {
            orderId,
            lat: order.driverLat,
            lng: order.driverLng,
            timestamp: new Date().toISOString(),
          });
        }

        const driverId = order.driverId;
        if (driverId && activeDrivers.has(driverId)) {
          const driverSocket = activeDrivers.get(driverId);
          if (driverSocket) {
            io.to(driverSocket.socketId).emit("customer:tracking-started", {
              orderId,
              customerId: userId,
            });
          }
        }

        console.log(
          `Pelanggan ${userId} baru saja melacak pesanan ${orderId}.`,
        );
      });

      socket.on("customer:untrack-order", (orderId: string) => {
        socket.leave(`order:${orderId}`);
        console.log(
          `Pelanggan ${userId} baru saja menghentikan pelacakannya pada pesanan ${orderId}.`,
        );
      });
    } else if (role === "ADMIN") {
      console.log(`Admin ${userId} telah terhubung.`);

      socket.on("admin:get-active-drivers", () => {
        const drivers = Array.from(activeDrivers.values()).map((d) => ({
          userId: d.userId,
          socketId: d.socketId,
        }));
        socket.emit("admin:active-drivers-list", { drivers });
      });

      socket.on("admin:track-driver", (driverId: string) => {
        if (activeDrivers.has(driverId)) {
          socket.join(`driver:${driverId}`);
          console.log(`Admin ${userId} melacak posisi kurir ${driverId}.`);
        }
      });
    }

    socket.on("disconnect", () => {
      console.log(`Pengguna memutuskan koneksi: ${userId} (${role}).`);

      if (role === "DRIVER") {
        activeDrivers.delete(userId);
      } else if (role === "CUSTOMER") {
        activeCustomers.delete(userId);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io belum diinisialisasikan.");
  }
  return ioInstance;
};
