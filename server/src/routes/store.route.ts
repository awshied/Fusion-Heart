import { Router } from "express";
import {
  createStore,
  deleteStore,
  getAllStores,
  getNearestStores,
  getStoreById,
  updateStore,
} from "../controllers/store.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getAllStores);
router.get("/nearest", getNearestStores);
router.get("/:id", getStoreById);

router.post("/", authenticate, authorize("ADMIN"), createStore);
router.put("/:id", authenticate, authorize("ADMIN"), updateStore);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteStore);

export default router;
