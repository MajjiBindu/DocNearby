import Joi from "joi";
import { ROLES } from "../config/constants.js";

export const signupSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string()
    .valid(...ROLES.filter((r) => r !== "admin"))
    .default("patient"),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, and a number",
      "any.required": "Password is required",
    }),
  confirmPassword: Joi.any().valid(Joi.ref("password")).optional().messages({
    "any.only": "Passwords must match",
  }),
});

export const otpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    "string.pattern.base": "OTP must be 6 digits",
  }),
});
