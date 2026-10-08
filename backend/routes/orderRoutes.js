import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import * as customerOrderController from "../controllers/customerOrderController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["customer"]));

router.get("/", customerOrderController.getMyOrders);
router.get("/:id", customerOrderController.getMyOrder);

export default router;