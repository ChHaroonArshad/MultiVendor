import { Router } from "express";
import { optionalAuthMiddleware } from "../middleware/optionalAuthMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { supportLimiter } from "../middleware/rateLimitMiddleware.js";
import { createSupportSchema } from "../validators/reportValidator.js";
import * as reportController from "../controllers/reportController.js";

const router = Router();

router.post("/", supportLimiter, optionalAuthMiddleware, validateMiddleware(createSupportSchema), reportController.createSupportRequest);

export default router;