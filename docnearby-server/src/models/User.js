import mongoose from "mongoose";
import { ROLES } from "../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "patient" },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    otpHash: { type: String, select: false },
    otpExpiry: { type: Date },
    passwordResetToken: {
  type: String,
  default: null,
},
    passwordResetExpires: {
  type: Date,
  default: null,
},
    patientProfile: {
      dob: { type: Date },
      gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"] },
      bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"] },
      allergies: [{ type: String }],
      chronicConditions: [{ type: String }],
      emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relation: { type: String }
      }
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });
userSchema.index({ name: 1 });
userSchema.index({ role: 1 });

userSchema.path("email").validate(function (value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}, "Email must be valid");

export const User = mongoose.model("User", userSchema);
