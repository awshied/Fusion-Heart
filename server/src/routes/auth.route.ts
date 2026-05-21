import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);
router.post("/change-password", authenticate, changePassword);

export default router;
