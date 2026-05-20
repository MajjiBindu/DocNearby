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
  updateProfile,
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

router.post("/signup/request-otp", authLimiter, validate(signupSchema), requestSignupOtp);
router.post("/signup/verify-otp", authLimiter, validate(otpSchema), verifySignupOtp);
router.post("/login/request-otp", authLimiter, validate(loginSchema), requestLoginOtp);
router.post("/login/verify-otp", authLimiter, validate(otpSchema), verifyLoginOtp);
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  requestPasswordReset,
);
router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPassword,
);
router.get("/reset-password/:token", validateResetToken);
router.post("/resend-otp", authLimiter, resendOtp);

router.post("/signup/resend-otp", authLimiter, (req, res, next) => {
  req.body = { ...req.body, purpose: "signup" };
  return resendOtp(req, res, next);
});

router.post("/login/resend-otp", authLimiter, (req, res, next) => {
  req.body = { ...req.body, purpose: "login" };
  return resendOtp(req, res, next);
});

router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.patch("/profile", requireAuth, updateProfile);

export default router;
