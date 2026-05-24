import { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "../lib/database";

// Helper: Validasi ID
const getStringParam = (
  param: string | string[] | undefined,
): string | undefined => {
  if (typeof param === "string") return param;
  if (Array.isArray(param) && param.length > 0) return param[0];
  return undefined;
};

// Inisialisasi Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

// Melakukan Pembayaran untuk Sebuah Pesanan
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "ID pesanan harus ada." });
    }

    // Cek Apakah Pesanan Ada dan Milik Pelanggan Terkait
    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        paymentStatus: true,
        customerId: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    if (order.customerId !== userId && (req as any).user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ error: "Pesanan sudah dibayar." });
    }

    // Buat Payment Intent di Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: "idr",
      metadata: {
        orderId: order.id,
        invoiceNumber: order.invoiceNumber,
        customerId: userId,
      },
      description: `Pesanan Fusion Heart - ${order.invoiceNumber}`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentIntentId: paymentIntent.id },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.total,
      currency: "idr",
    });
  } catch (error) {
    console.error("Anda tidak dapat melakukan pembayaran:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Konfirmasi Pembayaran (Tanpa Stripe)
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "ID pesanan dibutuhkan." });
    }

    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
      select: {
        id: true,
        invoiceNumber: true,
        paymentStatus: true,
        customerId: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    if (order.customerId !== userId && (req as any).user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ error: "Pesanan telah dibayar." });
    }

    // Update Status Pembayaran
    const updatedOrder = await prisma.order.update({
      where: { id: String(orderId) },
      data: { paymentStatus: "PAID" },
      select: {
        id: true,
        invoiceNumber: true,
        paymentStatus: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Pembayaran berhasil dikonfirmasi.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Anda tidak mengkonfirmasi pembayaran:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Memuat Status Pembayaran
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { orderId } = req.params;
    const orderIdStr = getStringParam(orderId);

    if (!orderIdStr) {
      return res.status(400).json({ error: "ID pesanan tidak valid." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderIdStr },
      select: {
        id: true,
        invoiceNumber: true,
        paymentStatus: true,
        total: true,
        orderStatus: true,
        customerId: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan." });
    }

    if (order.customerId !== userId && (req as any).user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Akses ditolak." });
    }

    res.status(200).json({
      success: true,
      paymentStatus: order.paymentStatus,
      order: order,
    });
  } catch (error) {
    console.error("Anda tidak dapat memuat data pembayaran:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};

// Webhook Stripe untuk Menerima Notifikasi
export const stripeWebhook = async (req: Request, res: Response) => {
  try {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret || "",
      );
    } catch (err) {
      console.error(`Verifikasi persetujuan webhook gagal:`, err);
      return res.status(400).json({ error: "Persetujuan tidak valid." });
    }

    // Handle Event Berdasarkan Tipe
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          // Cek Apakah Mengandung Duplikasi
          const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            select: { paymentStatus: true },
          });

          if (existingOrder?.paymentStatus === "PAID") {
            console.log(`Pesanan ${orderId} telah ditandai sudah dibayar.`);
            break;
          }
          // Perbarui Status Pesanan di Database
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: "PAID" },
          });
          console.log(`Pembayaran berhasil dilakukan pada pesanan ${orderId}.`);
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log(`Pembayaran gagal: ${failedPayment.id}`);
        break;

      default:
        console.log(`Tipe event yang tidak dapat dihandle: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Server internal error." });
  }
};
