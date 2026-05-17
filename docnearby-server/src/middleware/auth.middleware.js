import jwt from "jsonwebtoken";
import { env } from "../config/constants.js";
import AppError from "../utils/AppError.js";

export function requireAuth(req, res, next) {
  // Prioritize HttpOnly cookie for security
  let token = req.cookies?.dn_token;

  if (!token) {
    const header = req.get("authorization") || "";
    const [scheme, val] = header.split(" ");
    if (scheme === "Bearer") token = val;
  }

  if (!token) {
    return next(new AppError("Please login to access this resource", 401, "UNAUTHORIZED"));
  }

  try {
    const payload = jwt.verify(token, env("JWT_SECRET", ""));
    req.user = payload;
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired session. Please login again.", 401, "TOKEN_EXPIRED"));
  }
}
