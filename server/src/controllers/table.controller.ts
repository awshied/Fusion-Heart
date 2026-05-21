import { Request, Response } from "express";
import prisma from "../lib/database";

// Helper: Validasi ID
const getStringParam = (
  param: string | string[] | undefined,
): string | undefined => {
  if (typeof param === "string") return param;
  if (Array.isArray(param) && param.length > 0) return param[0];
  return undefined;
};

// Menangkap Semua Meja yang Tersedia Dalam Masing-Masing Toko Buku
export const getTablesByStore = async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const storeIdStr = getStringParam(storeId);

    if (!storeIdStr) {
      return res.status(400).json({ error: "ID toko invalid." });
    }

    const { date } = req.query;

    // Dapatkan Semua Meja Di Toko Buku
    const tables = await prisma.table.findMany({
      where: { storeId: storeIdStr },
      orderBy: { tableNumber: "asc" },
    });

    // Jika Ada Parameter Date, Cek Booking untuk Tanggal Tersebut
    if (date && typeof date === "string") {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const bookings = await prisma.tableBooking.findMany({
        where: {
          bookingDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            not: "CANCELLED",
          },
          table: {
            storeId: storeIdStr,
          },
        },
        select: {
          tableId: true,
        },
      });

      const bookedTableIds = new Set(bookings.map((b) => b.tableId));

      // Tambahkan Informasi Ketersediaan
      const tablesWithAvailability = tables.map((table) => ({
        ...table,
        isAvailableForDate: !bookedTableIds.has(table.id),
      }));

      return res.status(200).json({
        success: true,
        date: startOfDay,
        tables: tablesWithAvailability,
      });
    }

    res.status(200).json({
      success: true,
      count: tables.length,
      tables,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat fetch semua data meja yang tersedia:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Menangkap Semua Meja Berdasarkan ID di Setiap Toko Buku
export const getTableById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tableId = getStringParam(id);

    if (!tableId) {
      return res.status(400).json({ error: "ID meja tidak valid." });
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        store: {
          select: { name: true, address: true, city: true },
        },
      },
    });

    if (!table) {
      return res.status(404).json({ error: "Meja tidak ditemukan." });
    }

    res.status(200).json({
      success: true,
      table,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat menangkap data meja berdasarkan ID:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Membuat atau Menambahkan Meja Baru (Admin Only)
export const createTable = async (req: Request, res: Response) => {
  try {
    const { storeId, tableNumber, capacity, isAvailable } = req.body;

    // Validasi Input
    if (!storeId || !tableNumber || !capacity) {
      return res.status(400).json({
        error: "Semua field tidak boleh kosong.",
      });
    }

    // Cek Apakah Toko Ada
    const store = await prisma.store.findUnique({
      where: { id: String(storeId) },
    });

    if (!store) {
      return res.status(404).json({ error: "Toko Buku tidak ditemukan." });
    }

    // Cek Apakah Nomor Meja Sudah Ada di Toko yang Sama
    const existingTable = await prisma.table.findFirst({
      where: {
        storeId: String(storeId),
        tableNumber: String(tableNumber),
      },
    });

    if (existingTable) {
      return res
        .status(409)
        .json({ error: "Nomor meja sudah tersedia di toko ini." });
    }

    const table = await prisma.table.create({
      data: {
        storeId: String(storeId),
        tableNumber: String(tableNumber),
        capacity:
          typeof capacity === "string" ? parseInt(capacity) : Number(capacity),
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Meja berhasil ditambahkan.",
      table,
    });
  } catch (error) {
    console.error("Anda tidak dapat menambahkan meja baru:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Memperbarui Meja yang Tersedia (Admin Only)
export const updateTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tableId = getStringParam(id);

    if (!tableId) {
      return res.status(400).json({ error: "ID meja tidak valid." });
    }

    const { tableNumber, capacity, isAvailable } = req.body;

    // Cek Apakah Meja Ada
    const existingTable = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!existingTable) {
      return res.status(404).json({ error: "Meja tidak ditemukan." });
    }

    // Jika Mengganti Nomor Meja, Cek Duplikasi
    if (tableNumber && tableNumber !== existingTable.tableNumber) {
      const duplicateTable = await prisma.table.findFirst({
        where: {
          storeId: existingTable.storeId,
          tableNumber: String(tableNumber),
          id: { not: tableId },
        },
      });

      if (duplicateTable) {
        return res
          .status(409)
          .json({ error: "Nomor meja sudah tersedia di toko ini." });
      }
    }

    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: {
        tableNumber: tableNumber
          ? String(tableNumber)
          : existingTable.tableNumber,
        capacity: capacity
          ? typeof capacity === "string"
            ? parseInt(capacity)
            : Number(capacity)
          : existingTable.capacity,
        isAvailable:
          isAvailable !== undefined
            ? Boolean(isAvailable)
            : existingTable.isAvailable,
      },
    });

    res.status(200).json({
      success: true,
      message: "Meja berhasil diperbarui.",
      table: updatedTable,
    });
  } catch (error) {
    console.error(
      "Anda tidak dapat memperbarui detail dan informasi meja di toko ini:",
      error,
    );
    res.status(500).json({ error: "Internal server error." });
  }
};

// Menghapus Meja dari Toko (Admin Only)
export const deleteTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tableId = getStringParam(id);

    if (!tableId) {
      return res.status(400).json({ error: "ID meja tidak valid." });
    }

    // Cek Apakah Meja sudah Ada
    const existingTable = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        bookings: {
          where: {
            status: { not: "CANCELLED" },
            bookingDate: { gt: new Date() },
          },
          take: 1,
        },
      },
    });

    if (!existingTable) {
      return res.status(404).json({ error: "Meja tidak ditemukan." });
    }

    // Cek Apakah Ada Booking Aktif di Masa Depan
    if (existingTable.bookings.length > 0) {
      return res.status(400).json({
        error:
          "Tidak dapat menghapus meja karena seseorang telah booking meja ini. Batalkan reservasi terlebih dahulu untuk menghapusnya.",
      });
    }

    await prisma.table.delete({
      where: { id: tableId },
    });

    res.status(200).json({
      success: true,
      message: "Meja berhasil dihapus.",
    });
  } catch (error) {
    console.error("Anda tidak dapat menghapus meja:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
