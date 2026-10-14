import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { suspendUserSchema } from "../validators/adminUserValidator.js";
import * as adminUserController from "../controllers/adminUserController.js";

const router = Router();

router.use(authMiddleware, roleMiddleware(["admin"]));

router.get("/stats", adminUserController.getUserStats); // before /:id
router.get("/", adminUserController.listUsers);
router.get("/:id", adminUserController.getUser);
router.patch("/:id/suspend", validateMiddleware(suspendUserSchema), adminUserController.suspendUser);
router.patch("/:id/reactivate", adminUserController.reactivateUser);

export default router;