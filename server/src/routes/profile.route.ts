import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  deleteAvatar,
} from "../controllers/profile.controller";
import { authenticate } from "../middlewares/auth.middleware";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, JPG, and WEBP images are allowed"));
    }
  },
});

const router = Router();

router.use(authenticate);

router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.post("/me/avatar", upload.single("avatar"), uploadAvatar);
router.delete("/me/avatar", deleteAvatar);

export default router;
