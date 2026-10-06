import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import * as orderController from "../controllers/orderController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["customer"]));
router.get("/", orderController.getMyOrders);
router.get("/:orderGroupId", orderController.getMyOrderGroup);

export default router;