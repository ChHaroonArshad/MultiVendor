import express from "express";
import { registerController, verifyEmailController, resendVerificationController, loginController } from "../controllers/authController.js";
import { validateMiddleware } from "../middleware/validateMiddleware.js";
import { registerSchema, resendVerificationSchema, loginSchema } from "../validators/authValidator.js";
import { registerLimiter, verifyEmailLimiter, resendVerificationLimiter, loginLimiter } from "../middleware/rateLimitMiddleware.js";
import { refreshController, logoutController } from "../controllers/authController.js";
import { forgotPasswordController } from "../controllers/authController.js";
import { forgotPasswordSchema } from "../validators/authValidator.js";
import { forgotPasswordLimiter } from "../middleware/rateLimitMiddleware.js";
import { resetPasswordController } from "../controllers/authController.js";
import { resetPasswordSchema } from "../validators/authValidator.js";
import { resetPasswordLimiter } from "../middleware/rateLimitMiddleware.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { meController, changePasswordController } from "../controllers/authController.js";
import { changePasswordSchema } from "../validators/authValidator.js";
import { changePasswordLimiter } from "../middleware/rateLimitMiddleware.js";

import { googleStartController, googleCallbackController } from "../controllers/authController.js";
import { googleAuthLimiter } from "../middleware/rateLimitMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.get("/admin-check", authMiddleware, roleMiddleware(["admin"]), (req, res) =>
  sendSuccessResponse(res, 200, "Admin access granted")
);

router.post("/register", registerLimiter, validateMiddleware(registerSchema), registerController);
router.get("/verify-email", verifyEmailLimiter, verifyEmailController);
router.post("/resend-verification", resendVerificationLimiter, validateMiddleware(resendVerificationSchema), resendVerificationController);
router.post("/login", loginLimiter, validateMiddleware(loginSchema), loginController);
router.post("/forgot-password", forgotPasswordLimiter, validateMiddleware(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", resetPasswordLimiter, validateMiddleware(resetPasswordSchema), resetPasswordController);

router.get("/google", googleAuthLimiter, googleStartController);
router.get("/google/callback", googleCallbackController);
router.post("/refresh", refreshController);
router.post("/logout", logoutController);
router.get("/me", authMiddleware, meController);
router.post( "/change-password",   authMiddleware,   changePasswordLimiter,  validateMiddleware(changePasswordSchema),  changePasswordController);
export default router;