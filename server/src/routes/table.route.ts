import { Router } from "express";
import {
  createTable,
  deleteTable,
  getTableById,
  getTablesByStore,
  updateTable,
} from "../controllers/table.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get("/store/:storeId", getTablesByStore);
router.get("/:id", getTableById);

router.post("/", authenticate, authorize("ADMIN"), createTable);
router.put("/:id", authenticate, authorize("ADMIN"), updateTable);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteTable);

export default router;
