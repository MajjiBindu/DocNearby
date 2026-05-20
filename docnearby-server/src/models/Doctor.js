import mongoose from 'mongoose'
import { DAYS } from '../config/constants.js'

const slotSchema = new mongoose.Schema(
  {
    day: { type: String, enum: DAYS, required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "13:00"
    slotDuration: { type: Number, required: true }, // minutes
    clinicName: { type: String },
    location: { type: String },
    coordinates: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
  },
  { _id: false },
)

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    specialty: { type: String, default: '' },
    profilePhoto: { type: String, default: '' },
    bio: { type: String, default: '' },
    qualifications: [{ type: String }],
    languages: [{ type: String }],
    consultationFee: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', index: true },
    availableSlots: [slotSchema],
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    blockedDates: { type: [String], default: [] },
  },
  { versionKey: false },
)

doctorSchema.index({ specialty: 1 })
doctorSchema.index({ rating: -1 })
doctorSchema.index({ consultationFee: 1 })
doctorSchema.index({ isVerified: 1 })
doctorSchema.index({ "availableSlots.coordinates": "2dsphere" })

export const Doctor = mongoose.model('Doctor', doctorSchema)

