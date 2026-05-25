import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  cancelOrder,
  checkoutFromCart,
  getMyOrders,
  getOrderById,
} from "../controllers/order.controller";

const router = Router();

router.use(authenticate);

router.post("/checkout", checkoutFromCart);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);
router.post("/:id/cancel", cancelOrder);

export default router;
