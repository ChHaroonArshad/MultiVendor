import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import * as adminOverviewController from "../controllers/adminOverviewController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["admin"]));
router.get("/", adminOverviewController.getOverview);

export default router;