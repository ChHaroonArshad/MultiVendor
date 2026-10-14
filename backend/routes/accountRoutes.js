import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { validateByRoleMiddleware } from "../middleware/validateByRoleMiddleware.js";
import { handleAvatarUpload } from "../middleware/avatarUploadMiddleware.js";
import { avatarUploadLimiter, deleteAccountLimiter } from "../middleware/rateLimitMiddleware.js";
import { updateProfileSchema, preferenceSchemasByRole, deleteAccountSchema } from "../validators/accountValidator.js";
import * as accountController from "../controllers/accountController.js";

const router = Router();

// Any logged-in role may manage its OWN account (the user id always comes from the JWT).
router.use(authMiddleware);

router.patch("/profile", validateMiddleware(updateProfileSchema), accountController.updateProfile);
router.post("/avatar", avatarUploadLimiter, handleAvatarUpload, accountController.uploadAvatar);
router.delete("/avatar", accountController.removeAvatar);
router.patch("/preferences", validateByRoleMiddleware(preferenceSchemasByRole), accountController.updatePreferences);
// POST (not DELETE) because some proxies drop the body of DELETE requests
router.post("/delete", deleteAccountLimiter, validateMiddleware(deleteAccountSchema), accountController.deleteAccount);

export default router;