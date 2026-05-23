import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  addToWishlist,
  checkWishlist,
  getMyWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.controller";

const router = Router();

router.use(authenticate);

router.get("/", getMyWishlist);
router.post("/", addToWishlist);
router.get("/check/:bookId", checkWishlist);
router.delete("/:bookId", removeFromWishlist);

export default router;
