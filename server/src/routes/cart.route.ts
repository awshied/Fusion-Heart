import { Router } from "express";
import {
  addToCart,
  clearCart,
  getMyCart,
  removeFromCart,
  selectStore,
  updateCartItem,
} from "../controllers/cart.controller";
import { authenticateOptional } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateOptional);

router.get("/", getMyCart);
router.post("/select-store", selectStore);
router.post("/add", addToCart);
router.put("/item/:itemId", updateCartItem);
router.delete("/item/:itemId", removeFromCart);
router.delete("/clear", clearCart);

export default router;
