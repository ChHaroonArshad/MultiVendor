import { Router } from "express";
import * as storeController from "../controllers/storeController.js";

const router = Router();

router.get("/", storeController.listPublicStores);
router.get("/:id", storeController.getPublicStore);

export default router;