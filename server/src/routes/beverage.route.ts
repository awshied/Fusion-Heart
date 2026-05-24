import { Router } from "express";
import {
  createBeverage,
  deleteBeverage,
  getAllBeverages,
  getBeverageById,
  updateBeverage,
} from "../controllers/beverage.controller";
import {
  authenticate,
  authenticateOptional,
  authorize,
} from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticateOptional, getAllBeverages);
router.get("/:id", authenticateOptional, getBeverageById);

router.post("/", authenticate, authorize("ADMIN"), createBeverage);
router.put("/:id", authenticate, authorize("ADMIN"), updateBeverage);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteBeverage);

export default router;
