import { Router } from "express";
import {
  me,
  requestLoginOtp,
  requestSignupOtp,
  resendOtp,
  verifyLoginOtp,
  verifySignupOtp,
  logout,
  requestPasswordReset,
  resetPassword,
  validateResetToken,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  signupSchema,
  loginSchema,
  otpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

router.post("/signup/request-otp", validate(signupSchema), requestSignupOtp);
router.post("/signup/verify-otp", validate(otpSchema), verifySignupOtp);
router.post("/login/request-otp", validate(loginSchema), requestLoginOtp);
router.post("/login/verify-otp", validate(otpSchema), verifyLoginOtp);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  requestPasswordReset,
);
router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPassword,
);
router.get("/reset-password/:token", validateResetToken);
router.post("/resend-otp", resendOtp);

router.post("/signup/resend-otp", (req, res, next) => {
  req.body = { ...req.body, purpose: "signup" };
  return resendOtp(req, res, next);
});

router.post("/login/resend-otp", (req, res, next) => {
  req.body = { ...req.body, purpose: "login" };
  return resendOtp(req, res, next);
});

router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
