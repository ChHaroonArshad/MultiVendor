import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import * as adminOrderController from "../controllers/adminOrderController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["admin"]));

router.get("/stats", adminOrderController.getOrderStats); // must stay ABOVE /:id
router.get("/", adminOrderController.getOrders);
router.get("/:id", adminOrderController.getOrder);

export default router;