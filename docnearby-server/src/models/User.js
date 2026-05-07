import mongoose from 'mongoose'
import { ROLES } from '../config/constants.js'

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ROLES, default: 'patient' },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
)

export const User = mongoose.model('User', userSchema)

