import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { handleProductImagesUpload } from "../middleware/uploadMiddleware.js";
import { createProductLimiter } from "../middleware/rateLimitMiddleware.js";
import { createProductSchema, updateProductSchema, publishSchema } from "../validators/productValidator.js";
import * as productController from "../controllers/productController.js";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["seller"]), productController.getMyProducts);
router.get("/:id", authMiddleware, roleMiddleware(["seller"]), productController.getProduct);

router.post(
  "/",
  createProductLimiter,
  authMiddleware,
  roleMiddleware(["seller"]),
  handleProductImagesUpload,
  validateMiddleware(createProductSchema),
  productController.createProduct
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["seller"]),
  handleProductImagesUpload,
  validateMiddleware(updateProductSchema),
  productController.updateProduct
);

router.patch(
  "/:id/publish",
  authMiddleware,
  roleMiddleware(["seller"]),
  validateMiddleware(publishSchema),
  productController.togglePublish
);

router.delete("/:id", authMiddleware, roleMiddleware(["seller"]), productController.deleteProduct);

export default router;