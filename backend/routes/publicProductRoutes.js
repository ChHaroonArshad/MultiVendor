import { Router } from "express";
import * as publicProductController from "../controllers/publicProductController.js";

const router = Router();

router.get("/", publicProductController.listPublicProducts);
router.get("/:id", publicProductController.getPublicProduct);

export default router;