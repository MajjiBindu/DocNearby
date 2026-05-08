import { env } from "../config/constants.js";
import { sendOtpSms, verifyOtpSms, isMsg91Configured } from "./sms.service.js";

const store = new Map();
const OTP_ATTEMPTS_LIMIT = 5;

function normalizeMobile(mobile) {
  return String(mobile || "")
    .replace(/\D/g, "")
    .slice(-10);
}

function nowMs() {
  return Date.now();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function expiryMs() {
  return Number(env("OTP_EXPIRY_MINUTES", 5)) * 60 * 1000;
}

export async function sendOtp(mobile) {
  const normalized = normalizeMobile(mobile);
  if (!normalized || normalized.length !== 10) {
    throw new Error("Invalid mobile number");
  }

  const otp = generateOtp();
  const expiresAt = new Date(nowMs() + expiryMs());
  store.set(normalized, { otp, expiresAt, attempts: 0 });

  await sendOtpSms(normalized, otp);
  console.log(
    `[OTP] sent mobile=91${normalized} expiresAt=${expiresAt.toISOString()}`,
  );

  return { mobile: normalized, expiresAt };
}

export async function verifyOtp(mobile, otp) {
  const normalized = normalizeMobile(mobile);
  if (!normalized || normalized.length !== 10) {
    return { ok: false, reason: "invalid_mobile" };
  }

  if (isMsg91Configured()) {
    const result = await verifyOtpSms(normalized, otp);
    if (!result.ok) {
      return { ok: false, reason: result.reason || "invalid_otp" };
    }
    return { ok: true };
  }

  const record = store.get(normalized);
  if (!record) return { ok: false, reason: "no_otp" };

  if (nowMs() > record.expiresAt) {
    store.delete(normalized);
    return { ok: false, reason: "expired" };
  }

  if (record.attempts >= OTP_ATTEMPTS_LIMIT) {
    return { ok: false, reason: "max_attempts" };
  }

  record.attempts += 1;
  if (String(otp) !== record.otp) {
    return { ok: false, reason: "invalid" };
  }

  store.delete(normalized);
  return { ok: true };
}
