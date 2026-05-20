import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/constants.js";
import AppError from "../utils/AppError.js";
import * as otpService from "./otp.service.js";
import * as emailService from "./email.service.js";
import * as userService from "./user.service.js";
import { User } from "../models/User.js";

const SIGNUP_PURPOSE = "signup";
const LOGIN_PURPOSE = "login";

export const signToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    env("JWT_SECRET", ""),
    { expiresIn: env("JWT_EXPIRY", "7d") },
  );
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const createPasswordResetToken = async (email) => {
  const user = await userService.findByEmail(email);
  if (!user) return null;

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await user.save({ validateBeforeSave: false });
  return resetToken;
};

export const getUserByPasswordResetToken = async (token) => {
  if (!token) return null;

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: mongoose.trusted({ $gt: new Date() }),
  });
};
export const resetPassword = async (user, password) => {
  if (!user)
    throw new AppError("Invalid password reset token", 400, "invalid_token");

  user.password = await hashPassword(password);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
};

export const requestOtp = async (purpose, email) => {
  const session = await otpService.createOtpSession(purpose, email);

  if (purpose === SIGNUP_PURPOSE) {
    await emailService.sendSignupOtpEmail(email, session.otp);
  } else {
    await emailService.sendLoginOtpEmail(email, session.otp);
  }

  return session;
};

export const verifyOtp = async (purpose, email, otp) => {
  const verdict = await otpService.verifyOtpSession(purpose, email, otp);
  if (!verdict.ok) {
    const errorMessages = {
      expired: "OTP expired",
      max_attempts: "Maximum OTP attempts reached",
      no_otp: "No OTP request found for this email",
    };
    throw new AppError(
      errorMessages[verdict.reason] || "Invalid OTP",
      401,
      verdict.reason,
    );
  }
};
export const consumeOtp = async (purpose, email) => {
  await otpService.consumeOtpSession(purpose, email);
};
