import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { wishlistLimiter } from "../middleware/rateLimitMiddleware.js";
import { addWishlistSchema } from "../validators/wishlistValidator.js";
import * as wishlistController from "../controllers/wishlistController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["customer"]), wishlistLimiter);

router.get("/ids", wishlistController.ids); // fixed paths before the parameter route
router.get("/", wishlistController.list);
router.post("/", validateMiddleware(addWishlistSchema), wishlistController.add);
router.delete("/", wishlistController.clear);
router.delete("/:productId", wishlistController.remove);

export default router;