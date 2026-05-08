import bcrypt from "bcryptjs";
import { env } from "../config/constants.js";

const store = new Map();
const OTP_ATTEMPTS_LIMIT = 5;

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

function keyFor(purpose, email) {
  return `${purpose}:${normalizeEmail(email)}`;
}

export async function createOtpSession(purpose, email, data = {}) {
  try {
    const normalized = normalizeEmail(email);
    console.log("[OTP] Creating OTP session", { purpose, email: normalized });
    if (!normalized) throw new Error("Email is required");

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    console.log("[OTP] OTP hashing success", { purpose, email: normalized });

    const expiresAt = new Date(nowMs() + expiryMs());
    store.set(keyFor(purpose, normalized), {
      email: normalized,
      otpHash,
      expiresAt,
      attempts: 0,
      data,
    });
    console.log("[OTP] Temporary OTP session save success", {
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
    const key = keyFor(purpose, normalized);
    console.log("[OTP] Verifying OTP session", { purpose, email: normalized });
    const record = store.get(key);
    if (!record) return { ok: false, reason: "no_otp" };

    if (nowMs() > record.expiresAt) {
      store.delete(key);
      return { ok: false, reason: "expired" };
    }

    if (record.attempts >= OTP_ATTEMPTS_LIMIT) {
      return { ok: false, reason: "max_attempts" };
    }

    record.attempts += 1;
    const matches = await bcrypt.compare(String(otp || ""), record.otpHash);
    if (!matches) {
      console.log("[OTP] Invalid OTP", { purpose, email: normalized });
      return { ok: false, reason: "invalid" };
    }

    console.log("[OTP] OTP verified successfully", { purpose, email: normalized });
    return { ok: true, data: record.data };
  } catch (error) {
    console.error("[ERROR] [OTP] Failed to verify OTP session:", error);
    throw error;
  }
}

export function consumeOtpSession(purpose, email) {
  const normalized = normalizeEmail(email);
  const deleted = store.delete(keyFor(purpose, normalized));
  console.log("[OTP] OTP session consumed", {
    purpose,
    email: normalized,
    deleted,
  });
  return deleted;
}

export function getOtpSession(purpose, email) {
  try {
    const normalized = normalizeEmail(email);
    const record = store.get(keyFor(purpose, normalized));
    if (!record) return null;
    if (nowMs() > record.expiresAt) {
      store.delete(keyFor(purpose, normalized));
      return null;
    }
    return record;
  } catch (error) {
    console.error("[ERROR] [OTP] Failed to read OTP session:", error);
    throw error;
  }
}
