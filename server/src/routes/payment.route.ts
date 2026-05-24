import express from "express";
import { Router } from "express";
import {
  confirmPayment,
  createPaymentIntent,
  getPaymentStatus,
  stripeWebhook,
} from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

router.use(authenticate);

router.post("/create-intent", createPaymentIntent);
router.post("/confirm", confirmPayment);
router.get("/status/:orderId", getPaymentStatus);

export default router;
