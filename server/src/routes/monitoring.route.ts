import { Router } from "express";
import {
  getHeart,
  getLogContent,
  getLogFiles,
  getSystemMetrics,
} from "../controllers/monitoring.controller";
import {
  authenticate,
  authenticateOptional,
  authorize,
} from "../middlewares/auth.middleware";

const router = Router();

router.get("/heart", authenticateOptional, getHeart);

router.use(authenticate, authorize("ADMIN"));

router.get("/logs", getLogFiles);
router.get("/logs/:filename", getLogContent);
router.get("/metrics", getSystemMetrics);

export default router;
