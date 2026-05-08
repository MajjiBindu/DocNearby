import mongoose from "mongoose";
import { ROLES } from "../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      alias: "phone",
    },
    name: { type: String, trim: true, default: "" },
    role: { type: String, enum: ROLES, default: "patient" },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.path("mobile").validate(function (value) {
  return /^\d{10}$/.test(value);
}, "Mobile number must be 10 digits");

export const User = mongoose.model("User", userSchema);
