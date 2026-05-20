import * as authService from "../services/auth.service.js";
import * as userService from "../services/user.service.js";
import * as otpService from "../services/otp.service.js";
import * as emailService from "../services/email.service.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

const SIGNUP_PURPOSE = "signup";
const LOGIN_PURPOSE = "login";

/**
 * @desc Request Signup OTP
 * @route POST /api/auth/signup-otp
 */
export const requestSignupOtp = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await userService.findByEmail(email);
  if (existing) {
    throw new AppError("Email is already registered", 409, "email_exists");
  }

  const passwordHash = await authService.hashPassword(password);
  const session = await authService.requestOtp(SIGNUP_PURPOSE, email, {
    name,
    email,
    passwordHash,
    role,
  });

  logger.info(`Signup OTP requested: ${email}`);
  return sendResponse(res, 200, "Signup OTP sent to email", {
    email,
    expiresAt: session.expiresAt,
  });
});

/**
 * @desc Verify Signup OTP
 * @route POST /api/auth/verify-signup
 */
export const verifySignupOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const existing = await userService.findByEmail(email);
  if (existing) {
    throw new AppError("Email is already registered", 409, "email_exists");
  }

  const payload = await authService.verifyOtp(SIGNUP_PURPOSE, email, otp);

  const user = await userService.createUser({
    name: payload.name,
    email: payload.email,
    password: payload.passwordHash,
    role: payload.role,
    isVerified: true,
  });

  authService.consumeOtp(SIGNUP_PURPOSE, email);
  const token = authService.signToken(user);

  res.cookie("dn_token", token, authService.cookieOptions);

  logger.info(`User registered and verified: ${email}`);
  return sendResponse(res, 201, "Signup verified", { user, token });
});

/**
 * @desc Request Login OTP
 * @route POST /api/auth/login-otp
 */
export const requestLoginOtp = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await userService.findByEmail(email, true);
  if (!user || !(await authService.comparePassword(password, user.password))) {
    throw new AppError("Invalid email or password", 401, "invalid_credentials");
  }

  const session = await authService.requestOtp(LOGIN_PURPOSE, email, {
    userId: user._id.toString(),
  });

  logger.info(`Login OTP requested: ${email}`);
  return sendResponse(res, 200, "Login OTP sent to email", {
    email,
    expiresAt: session.expiresAt,
  });
});

/**
 * @desc Verify Login OTP
 * @route POST /api/auth/verify-login
 */
export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const payload = await authService.verifyOtp(LOGIN_PURPOSE, email, otp);

  const user = await userService.findById(payload.userId);
  if (!user) throw new AppError("User not found", 404, "user_not_found");

  const token = authService.signToken(user);
  authService.consumeOtp(LOGIN_PURPOSE, email);

  res.cookie("dn_token", token, authService.cookieOptions);

  logger.info(`User logged in: ${email}`);
  return sendResponse(res, 200, "Login verified", { user, token });
});

/**
 * @desc Logout user
 * @route POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("dn_token", {
    ...authService.cookieOptions,
    maxAge: 0,
  });
  return sendResponse(res, 200, "Logged out successfully");
});
/**
 * @desc Validate Password Reset Token (for page load check)
 * @route GET /api/auth/reset-password/:token
 */
export const validateResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await authService.getUserByPasswordResetToken(token);
  if (!user) {
    throw new AppError(
      "Invalid or expired password reset token",
      400,
      "invalid_or_expired_token",
    );
  }

  return sendResponse(res, 200, "Token is valid");
});
/**
 * @desc Request Password Reset Email
 * @route POST /api/auth/forgot-password
 */
export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();

  const resetToken =
    await authService.createPasswordResetToken(normalizedEmail);
  console.log("Generated reset token:", resetToken);

  const frontendUrl = (process.env.CLIENT_URL || "http://localhost:5173")
    .trim()
    .replace(/\/$/, "");
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
  console.log("Reset URL being sent:", resetUrl);

  if (resetToken) {
    await emailService.sendPasswordResetEmail(normalizedEmail, {
      resetUrl,
      expiresInMinutes: 60,
    });
    logger.info(`Password reset requested for ${normalizedEmail}`);
  }

  return sendResponse(
    res,
    200,
    "If an account exists with this email, a reset link has been sent.",
  );
});

/**
 * @desc Reset Password
 * @route POST /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await authService.getUserByPasswordResetToken(token);
  if (!user) {
    throw new AppError(
      "Invalid or expired password reset token",
      400,
      "invalid_or_expired_token",
    );
  }

  await authService.resetPassword(user, password);
  res.clearCookie("dn_token", {
    ...authService.cookieOptions,
    maxAge: 0,
  });

  logger.info(`Password reset successfully for ${user.email}`);
  return sendResponse(
    res,
    200,
    "Password reset successful. Please sign in with your new password.",
  );
});

/**
 * @desc Resend OTP
 * @route POST /api/auth/resend-otp
 */
export const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;

  if (![SIGNUP_PURPOSE, LOGIN_PURPOSE].includes(purpose)) {
    throw new AppError("Invalid OTP purpose", 400, "purpose_invalid");
  }

  const existingSession = otpService.getOtpSession(purpose, email);
  if (!existingSession) {
    throw new AppError("No active OTP request found", 404, "no_otp");
  }

  const session = await authService.requestOtp(
    purpose,
    email,
    existingSession.data,
  );

  logger.info(`OTP resent: ${email} (${purpose})`);
  return sendResponse(res, 200, "OTP resent", {
    email,
    expiresAt: session.expiresAt,
  });
});

/**
 * @desc Get current user
 * @route GET /api/auth/me
 */
export const me = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError("Unauthorized", 401, "missing_user");

  const user = await userService.findById(userId);
  if (!user) throw new AppError("User not found", 404, "user_not_found");

  return sendResponse(res, 200, "User fetched", { user });
});

/**
 * @desc Update patient profile
 * @route PATCH /api/auth/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError("Unauthorized", 401, "missing_user");

  const user = await userService.findById(userId);
  if (!user) throw new AppError("User not found", 404, "user_not_found");

  const { dob, gender, bloodGroup, allergies, chronicConditions, emergencyContact } = req.body;

  user.patientProfile = {
    ...user.patientProfile,
    ...(dob !== undefined && { dob }),
    ...(gender !== undefined && { gender }),
    ...(bloodGroup !== undefined && { bloodGroup }),
    ...(allergies !== undefined && { allergies }),
    ...(chronicConditions !== undefined && { chronicConditions }),
    ...(emergencyContact !== undefined && { emergencyContact })
  };

  await user.save();

  return sendResponse(res, 200, "Profile updated successfully", { user });
});
