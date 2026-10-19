import { Router } from "express";
import * as publicStatsController from "../controllers/publicStatsController.js";

const router = Router();

router.get("/stats", publicStatsController.stats);

export default router;