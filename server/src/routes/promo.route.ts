import { Router } from "express";
import {
  createPromo,
  deletePromo,
  getActivePromos,
  getAllPromos,
  getPromoById,
  updatePromo,
  validatePromo,
} from "../controllers/promo.controller";
import {
  authenticate,
  authenticateOptional,
  authorize,
} from "../middlewares/auth.middleware";

const router = Router();

router.get("/active", authenticateOptional, getActivePromos);
router.post("/validate", authenticateOptional, validatePromo);

router.use(authenticate, authorize("ADMIN"));

router.get("/", getAllPromos);
router.get("/:id", getPromoById);
router.post("/", createPromo);
router.put("/:id", updatePromo);
router.delete("/:id", deletePromo);

export default router;
