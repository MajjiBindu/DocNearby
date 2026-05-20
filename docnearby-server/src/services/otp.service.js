import bcrypt from "bcryptjs";
import { env } from "../config/constants.js";
import { User } from "../models/User.js";

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function nowMs() {
  return Date.now();
}

export function generateOtp() {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  console.log("[OTP] OTP generated successfully");
  return otp;
}

function expiryMs() {
  return Number(env("OTP_EXPIRY_MINUTES", 5)) * 60 * 1000;
}

export async function createOtpSession(purpose, email) {
  try {
    const normalized = normalizeEmail(email);
    console.log("[OTP] Creating OTP session", { purpose, email: normalized });
    if (!normalized) throw new Error("Email is required");

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    console.log("[OTP] OTP hashing success", { purpose, email: normalized });

    const expiresAt = new Date(nowMs() + expiryMs());
    
    const user = await User.findOneAndUpdate(
      { email: normalized },
      { otpHash, otpExpiry: expiresAt },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    console.log("[OTP] OTP session save success", {
      purpose,
      email: normalized,
      expiresAt: expiresAt.toISOString(),
    });

    return { email: normalized, otp, otpHash, expiresAt };
  } catch (error) {
    console.error("[ERROR] [OTP] Failed to create OTP session:", error);
    throw error;
  }
}

export async function verifyOtpSession(purpose, email, otp) {
  try {
    const normalized = normalizeEmail(email);
    console.log("[OTP] Verifying OTP session", { purpose, email: normalized });
    
    const user = await User.findOne({ email: normalized }).select("+otpHash");
    if (!user || !user.otpHash) return { ok: false, reason: "no_otp" };

    if (nowMs() > new Date(user.otpExpiry).getTime()) {
      await User.updateOne({ _id: user._id }, { $unset: { otpHash: 1, otpExpiry: 1 } });
      return { ok: false, reason: "expired" };
    }

    const matches = await bcrypt.compare(String(otp || ""), user.otpHash);
    if (!matches) {
      console.log("[OTP] Invalid OTP", { purpose, email: normalized });
      return { ok: false, reason: "invalid" };
    }

    console.log("[OTP] OTP verified successfully", { purpose, email: normalized });
    return { ok: true };
  } catch (error) {
    console.error("[ERROR] [OTP] Failed to verify OTP session:", error);
    throw error;
  }
}

export async function consumeOtpSession(purpose, email) {
  const normalized = normalizeEmail(email);
  await User.updateOne({ email: normalized }, { $unset: { otpHash: 1, otpExpiry: 1 } });
  console.log("[OTP] OTP session consumed", {
    purpose,
    email: normalized
  });
  return true;
}

export async function getOtpSession(purpose, email) {
  try {
    const normalized = normalizeEmail(email);
    const user = await User.findOne({ email: normalized });
    if (!user || !user.otpExpiry) return null;
    
    if (nowMs() > new Date(user.otpExpiry).getTime()) {
      await User.updateOne({ _id: user._id }, { $unset: { otpHash: 1, otpExpiry: 1 } });
      return null;
    }
    
    return { email: normalized, expiresAt: user.otpExpiry };
  } catch (error) {
    console.error("[ERROR] [OTP] Failed to read OTP session:", error);
    throw error;
  }
}
