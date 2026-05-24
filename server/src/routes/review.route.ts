import { Router } from "express";
import {
  createReview,
  deleteReview,
  getBookReviews,
  getDriverReviews,
  updateReview,
} from "../controllers/review.controller";
import {
  authenticate,
  authenticateOptional,
} from "../middlewares/auth.middleware";

const router = Router();

router.get("/book/:bookId", authenticateOptional, getBookReviews);
router.get("/driver/:driverId", authenticateOptional, getDriverReviews);

router.use(authenticate);

router.post("/", createReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

export default router;
