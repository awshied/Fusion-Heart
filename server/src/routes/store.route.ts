import { Router } from "express";
import {
  createStore,
  deleteStore,
  getAllStores,
  getNearestStores,
  getStoreById,
  updateStore,
} from "../controllers/store.controller";
import {
  authenticate,
  authenticateOptional,
  authorize,
} from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticateOptional, getAllStores);
router.get("/nearest", authenticateOptional, getNearestStores);
router.get("/:id", authenticateOptional, getStoreById);

router.post("/", authenticate, authorize("ADMIN"), createStore);
router.put("/:id", authenticate, authorize("ADMIN"), updateStore);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteStore);

export default router;
