import { Router } from "express";
import {
  createBook,
  deleteBook,
  getAllBooks,
  getBookById,
  getBookStock,
  updateBook,
  updateBookStock,
} from "../controllers/book.controller";
import {
  authenticate,
  authenticateOptional,
  authorize,
} from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticateOptional, getAllBooks);
router.get("/:id", authenticateOptional, getBookById);

router.post("/", authenticate, authorize("ADMIN"), createBook);
router.put("/:id", authenticate, authorize("ADMIN"), updateBook);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteBook);

router.get("/:bookId/stock", authenticate, authorize("ADMIN"), getBookStock);
router.post("/stock", authenticate, authorize("ADMIN"), updateBookStock);

export default router;
