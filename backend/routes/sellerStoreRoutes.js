import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { handleStoreImageUpload } from "../middleware/storeImageUploadMiddleware.js";
import { avatarUploadLimiter } from "../middleware/rateLimitMiddleware.js";
import { updateStoreSchema } from "../validators/storeValidator.js";
import * as storeController from "../controllers/storeController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["seller"]));
router.get("/status", storeController.getStoreStatus);
router.get("/", storeController.getMyStore);
router.patch("/", validateMiddleware(updateStoreSchema), storeController.updateMyStore);
router.post("/image/:kind", avatarUploadLimiter, handleStoreImageUpload, storeController.uploadStoreImage);
router.delete("/image/:kind", storeController.removeStoreImage);

export default router;