import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getCustomerActivity,
  getCustomerSegments,
  getDriverRanking,
  getSalesAnalytics,
  sendPromoToSegment,
} from "../controllers/analytic.controller";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/activity", getCustomerActivity);
router.get("/segments", getCustomerSegments);
router.get("/drivers/ranking", getDriverRanking);
router.get("/sales", getSalesAnalytics);
router.post("/promo/send", sendPromoToSegment);

export default router;
