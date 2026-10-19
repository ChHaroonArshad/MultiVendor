import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { resolveReportSchema } from "../validators/reportValidator.js";
import * as adminReportController from "../controllers/adminReportController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["admin"]));

router.get("/stats", adminReportController.stats); // must stay above /:id
router.get("/", adminReportController.list);
router.get("/:id", adminReportController.get);
router.patch("/:id/review", adminReportController.review);
router.patch("/:id/resolve", validateMiddleware(resolveReportSchema), adminReportController.resolve);

export default router;