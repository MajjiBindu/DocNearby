import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env, ROLES } from "../config/constants.js";
import { User } from "../models/User.js";
import { Doctor } from "../models/Doctor.js";
import {
  consumeOtpSession,
  createOtpSession,
  getOtpSession,
  normalizeEmail,
  verifyOtpSession,
} from "../services/otp.service.js";
import {
  sendLoginOtpEmail,
  sendSignupOtpEmail,
} from "../services/email.service.js";

const SIGNUP_PURPOSE = "signup";
const LOGIN_PURPOSE = "login";

function ok(res, data = {}, message = "") {
  return res.json({ success: true, data, message, error: "" });
}

function fail(res, status, message, error = "") {
  return res.status(status).json({ success: false, data: {}, message, error });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return String(password || "").length >= 8;
}

function isValidOtp(otp) {
  return /^\d{6}$/.test(String(otp || ""));
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    env("JWT_SECRET", ""),
    { expiresIn: env("JWT_EXPIRY", "7d") },
  );
}

async function ensureDoctorProfile(user) {
  if (user.role !== "doctor") return;

  const existingDoctor = await Doctor.findOne({ userId: user._id });
  if (!existingDoctor) {
    await Doctor.create({ userId: user._id });
  }
}

function otpFailureMessage(reason) {
  if (reason === "expired") return "OTP expired";
  if (reason === "max_attempts") return "Maximum OTP attempts reached";
  if (reason === "no_otp") return "No OTP request found for this email";
  return "Invalid OTP";
}

export async function requestSignupOtp(req, res) {
  try {
    console.log("[AUTH] Signup OTP request body:", {
      ...req.body,
      password: req.body?.password ? "[REDACTED]" : undefined,
    });

    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const role = req.body?.role || "patient";

    console.log("[AUTH] Signup email value:", email);
    console.log("[AUTH] Signup role value:", role);

    if (!name) return fail(res, 400, "Name is required", "name_required");
    if (!isValidEmail(email)) {
      return fail(res, 400, "Invalid email", "email_invalid");
    }
    if (!isValidPassword(password)) {
      return fail(
        res,
        400,
        "Password must be at least 8 characters",
        "password_too_short",
      );
    }
    if (!ROLES.includes(role) || role === "admin") {
      return fail(res, 400, "Invalid role", "role_invalid");
    }

    const existing = await User.findOne({ email }).select("_id");
    console.log("[AUTH] Existing user found:", Boolean(existing));
    if (existing) {
      return fail(res, 409, "Email is already registered", "email_exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    console.log("[AUTH] Signup password hashing success");

    const session = await createOtpSession(SIGNUP_PURPOSE, email, {
      name,
      email,
      passwordHash,
      role,
    });
    console.log("[AUTH] OTP generation success");
    console.log("[AUTH] OTP hashing success");
    console.log("[AUTH] Temporary signup/session save success", {
      email,
      expiresAt: session.expiresAt,
    });

    await sendSignupOtpEmail(email, session.otp);
    console.log("[AUTH] Signup OTP email sending success", { email });

    return ok(
      res,
      { email, expiresAt: session.expiresAt },
      "Signup OTP sent to email",
    );
  } catch (error) {
    console.error("[ERROR] [AUTH] Signup OTP request failed:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    return fail(
      res,
      500,
      error.message || "Unable to send signup OTP",
      "signup_otp_failed",
    );
  }
}

export async function verifySignupOtp(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();

    console.log("[AUTH] Verify signup OTP request", {
      email,
      otpProvided: Boolean(otp),
    });

    if (!isValidEmail(email)) {
      return fail(res, 400, "Invalid email", "email_invalid");
    }
    if (!isValidOtp(otp)) {
      return fail(res, 400, "Invalid OTP", "otp_invalid");
    }

    const existing = await User.findOne({ email }).select("_id");
    if (existing) {
      return fail(res, 409, "Email is already registered", "email_exists");
    }

    const verdict = await verifyOtpSession(SIGNUP_PURPOSE, email, otp);
    if (!verdict.ok) {
      return fail(res, 401, otpFailureMessage(verdict.reason), verdict.reason);
    }

    const payload = verdict.data;
    const user = await User.create({
      name: payload.name,
      email: payload.email,
      password: payload.passwordHash,
      role: payload.role,
      isVerified: true,
    });
    await ensureDoctorProfile(user);
    consumeOtpSession(SIGNUP_PURPOSE, email);

    const token = signToken(user);
    return ok(res, { token, user }, "Signup verified");
  } catch (error) {
    console.error("[ERROR] [AUTH] Verify signup OTP failed:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    const isDuplicateKey = error?.code === 11000;
    return fail(
      res,
      isDuplicateKey ? 409 : 500,
      isDuplicateKey
        ? "Unable to create user because a duplicate database index exists. Please retry after indexes are synchronized."
        : error.message || "Unable to verify signup OTP",
      isDuplicateKey ? "duplicate_user_index" : "signup_otp_verify_failed",
    );
  }
}

export async function requestLoginOtp(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!isValidEmail(email)) {
    return fail(res, 400, "Invalid email", "email_invalid");
  }
  if (!password) {
    return fail(res, 400, "Password is required", "password_required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return fail(res, 401, "Invalid email or password", "invalid_credentials");
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    return fail(res, 401, "Invalid email or password", "invalid_credentials");
  }

  const session = await createOtpSession(LOGIN_PURPOSE, email, {
    userId: user._id.toString(),
  });
  await sendLoginOtpEmail(email, session.otp);

  return ok(
    res,
    { email, expiresAt: session.expiresAt },
    "Login OTP sent to email",
  );
}

export async function verifyLoginOtp(req, res) {
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp || "").trim();

  if (!isValidEmail(email)) {
    return fail(res, 400, "Invalid email", "email_invalid");
  }
  if (!isValidOtp(otp)) {
    return fail(res, 400, "Invalid OTP", "otp_invalid");
  }

  const verdict = await verifyOtpSession(LOGIN_PURPOSE, email, otp);
  if (!verdict.ok) {
    return fail(res, 401, otpFailureMessage(verdict.reason), verdict.reason);
  }

  const user = await User.findById(verdict.data.userId);
  if (!user) return fail(res, 404, "User not found", "user_not_found");

  const token = signToken(user);
  consumeOtpSession(LOGIN_PURPOSE, email);
  return ok(res, { token, user }, "Login verified");
}

export async function resendOtp(req, res) {
  const email = normalizeEmail(req.body?.email);
  const purpose = String(req.body?.purpose || "").trim();

  if (!isValidEmail(email)) {
    return fail(res, 400, "Invalid email", "email_invalid");
  }
  if (![SIGNUP_PURPOSE, LOGIN_PURPOSE].includes(purpose)) {
    return fail(res, 400, "Invalid OTP purpose", "purpose_invalid");
  }

  const existingSession = getOtpSession(purpose, email);
  if (!existingSession) {
    return fail(res, 404, "No active OTP request found", "no_otp");
  }

  const session = await createOtpSession(purpose, email, existingSession.data);
  if (purpose === SIGNUP_PURPOSE) {
    await sendSignupOtpEmail(email, session.otp);
  } else {
    await sendLoginOtpEmail(email, session.otp);
  }

  return ok(res, { email, expiresAt: session.expiresAt }, "OTP resent");
}

export async function me(req, res) {
  const userId = req.user?.userId;
  if (!userId) return fail(res, 401, "Unauthorized", "missing_user");

  const user = await User.findById(userId);
  if (!user) return fail(res, 404, "User not found", "user_not_found");
  return ok(res, { user }, "User fetched");
}
