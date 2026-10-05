import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { addItemSchema, updateItemSchema } from "../validators/cartValidator.js";
import * as cartController from "../controllers/cartController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["customer"]));

router.get("/", cartController.getCart);
router.post("/items", validateMiddleware(addItemSchema), cartController.addItem);
router.patch("/items/:productId", validateMiddleware(updateItemSchema), cartController.updateItem);
router.delete("/items/:productId", cartController.removeItem);
router.delete("/", cartController.clearCart);

export default router;