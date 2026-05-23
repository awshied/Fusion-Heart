import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  assignDriver,
  createDriver,
  deleteDriver,
  getAllDrivers,
  getAllOrders,
  getDashboardStats,
  getDriverById,
  updateDriver,
  updateOrderStatus,
} from "../controllers/admin.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", getDashboardStats);

// Kelola Kurir
router.get("/drivers", getAllDrivers);
router.get("/drivers/:id", getDriverById);
router.post("/drivers", createDriver);
router.put("/drivers/:id", updateDriver);
router.delete("/drivers/:id", deleteDriver);

// Kelola Pesanan
router.get("/orders", getAllOrders);
router.post("/orders/:id/assign-driver", assignDriver);
router.put("/orders/:id/status", updateOrderStatus);

export default router;
