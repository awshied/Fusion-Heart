import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  acceptOrder,
  getDriverStats,
  getMyAssignedOrders,
  getMyOrderHistory,
  pickUpOrder,
  updateLocation,
} from "../controllers/driver.controller";

const router = Router();

router.use(authenticate);

router.get("/orders/assigned", authorize("DRIVER"), getMyAssignedOrders);
router.get("/orders/history", authorize("DRIVER"), getMyOrderHistory);
router.post("/orders/:id/accept", authorize("DRIVER"), acceptOrder);
router.post("/orders/:id/pickup", authorize("DRIVER"), pickUpOrder);
router.post("/location", authorize("DRIVER"), updateLocation);

router.get("/stats/:driverId", authorize("ADMIN"), getDriverStats);

export default router;
