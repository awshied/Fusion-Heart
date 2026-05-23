import { Router } from "express";
import {
  createReview,
  deleteReview,
  getBookReviews,
  getDriverReviews,
  updateReview,
} from "../controllers/review.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/book/:bookId", getBookReviews);
router.get("/driver/:driverId", getDriverReviews);

router.use(authenticate);

router.post("/", createReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

export default router;
