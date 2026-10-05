import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { rejectProductSchema } from "../validators/adminProductValidator.js";
import * as adminProductController from "../controllers/adminProductController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["admin"]));

router.get("/", adminProductController.getAllProducts);
router.get("/:id", adminProductController.getProduct);
router.patch("/:id/approve", adminProductController.approveProduct);
router.patch("/:id/reject", validateMiddleware(rejectProductSchema), adminProductController.rejectProduct);

export default router;