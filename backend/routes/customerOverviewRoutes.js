import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import * as customerOverviewController from "../controllers/customerOverviewController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["customer"]));
router.get("/", customerOverviewController.getOverview);

export default router;