import jwt from "jsonwebtoken";
import { env, ROLES } from "../config/constants.js";
import {
  sendOtp as sendOtpSvc,
  verifyOtp as verifyOtpSvc,
} from "../services/otp.service.js";
import { User } from "../models/User.js";
import { Doctor } from "../models/Doctor.js";

function ok(res, data = {}, message = "") {
  return res.json({ success: true, data, message, error: "" });
}
function fail(res, status, message, error = "") {
  return res.status(status).json({ success: false, data: {}, message, error });
}

function normalizeMobile(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(-10);
}

function isValidIndianMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile);
}

export async function sendOtp(req, res) {
  const mobile = normalizeMobile(req.body?.mobile || req.body?.phone);
  const role = req.body?.role;

  if (!mobile || !isValidIndianMobile(mobile)) {
    return fail(
      res,
      400,
      "Invalid mobile",
      "Mobile must be a valid 10-digit Indian number",
    );
  }
  if (role && !ROLES.includes(role)) {
    return fail(
      res,
      400,
      "Invalid role",
      "Role must be patient, doctor, or admin",
    );
  }

  const result = await sendOtpSvc(mobile);
  return ok(
    res,
    { mobile: result.mobile, expiresAt: result.expiresAt },
    "OTP sent",
  );
}

export async function verifyOtp(req, res) {
  const mobile = normalizeMobile(req.body?.mobile || req.body?.phone);
  const otp = String(req.body?.otp || "").trim();
  const role = req.body?.role || "patient";
  const name = String(req.body?.name || "").trim();

  if (!mobile || !isValidIndianMobile(mobile)) {
    return fail(
      res,
      400,
      "Invalid mobile",
      "Mobile must be a valid 10-digit Indian number",
    );
  }
  if (!otp || otp.length !== 6) {
    return fail(res, 400, "Invalid OTP", "OTP must be 6 digits");
  }
  if (!ROLES.includes(role)) {
    return fail(
      res,
      400,
      "Invalid role",
      "Role must be patient, doctor, or admin",
    );
  }

  const verdict = await verifyOtpSvc(mobile, otp);
  if (!verdict.ok) {
    const message =
      verdict.reason === "expired"
        ? "OTP expired"
        : verdict.reason === "max_attempts"
          ? "Maximum OTP attempts reached"
          : verdict.reason === "no_otp"
            ? "No OTP request found for this number"
            : "Invalid OTP";
    return fail(res, 401, message, verdict.reason);
  }

  let user = await User.findOne({ mobile });
  if (!user) {
    user = await User.create({ mobile, role, name });
  } else {
    if (role && user.role !== role && user.role !== "admin") {
      user.role = role;
    }
    if (name && !user.name) {
      user.name = name;
    }
    if (user.isModified()) {
      await user.save();
    }
  }

  if (user.role === "doctor") {
    const existingDoctor = await Doctor.findOne({ userId: user._id });
    if (!existingDoctor) {
      await Doctor.create({ userId: user._id });
    }
  }

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role, mobile: user.mobile },
    env("JWT_SECRET", ""),
    { expiresIn: env("JWT_EXPIRY", "7d") },
  );

  console.log(
    `[AUTH] OTP verified mobile=91${mobile} userId=${user._id.toString()}`,
  );
  return ok(res, { token, user }, "OTP verified");
}

export async function me(req, res) {
  const userId = req.user?.userId;
  if (!userId) return fail(res, 401, "Unauthorized", "missing_user");

  const user = await User.findById(userId);
  if (!user) return fail(res, 404, "User not found", "user_not_found");
  return ok(res, { user }, "User fetched");
}
