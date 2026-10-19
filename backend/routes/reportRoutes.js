import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { reportLimiter } from "../middleware/rateLimitMiddleware.js";
import { createReportSchema } from "../validators/reportValidator.js";
import * as reportController from "../controllers/reportController.js";

const router = Router();

// Customers and sellers report. Admins moderate directly and guests must sign in first.
router.use(authMiddleware, roleMiddleware(["customer", "seller"]), reportLimiter);
router.post("/", validateMiddleware(createReportSchema), reportController.createReport);

export default router;