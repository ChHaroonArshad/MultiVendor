import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import * as sellerOverviewController from "../controllers/sellerOverviewController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["seller"]));
router.get("/", sellerOverviewController.getOverview);

export default router;