import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { updateOrderStatusSchema } from "../validators/orderValidator.js";
import * as sellerOrderController from "../controllers/sellerOrderController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["seller"]));

router.get("/stats", sellerOrderController.getOrderStats);
router.get("/", sellerOrderController.getSellerOrders);
router.get("/:id", sellerOrderController.getSellerOrder);
router.patch("/:id/status", validateMiddleware(updateOrderStatusSchema), sellerOrderController.updateOrderStatus);

export default router;
