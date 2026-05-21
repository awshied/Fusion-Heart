import { Router } from "express";
import {
  createBeverage,
  deleteBeverage,
  getAllBeverages,
  getBeverageById,
  updateBeverage,
} from "../controllers/beverage.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getAllBeverages);
router.get("/:id", getBeverageById);

router.post("/", authenticate, authorize("ADMIN"), createBeverage);
router.put("/:id", authenticate, authorize("ADMIN"), updateBeverage);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteBeverage);

export default router;
