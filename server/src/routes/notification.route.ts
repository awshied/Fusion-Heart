import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  deleteNotification,
  getMyNotifications,
  markAllAsRead,
  markAsRead,
} from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

router.get("/", getMyNotifications);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
