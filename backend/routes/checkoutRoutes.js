import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { checkoutSchema } from "../validators/checkoutValidator.js";
import * as checkoutController from "../controllers/checkoutController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["customer"]));
router.post("/", validateMiddleware(checkoutSchema), checkoutController.checkout);

export default router;