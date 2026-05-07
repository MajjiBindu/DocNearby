import mongoose from 'mongoose'
import { DAYS } from '../config/constants.js'

const slotSchema = new mongoose.Schema(
  {
    day: { type: String, enum: DAYS, required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "13:00"
    slotDuration: { type: Number, required: true }, // minutes
  },
  { _id: false },
)

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    specialty: { type: String, default: '' },
    qualifications: [{ type: String }],
    languages: [{ type: String }],
    consultationFee: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', index: true },
    availableSlots: [slotSchema],
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { versionKey: false },
)

export const Doctor = mongoose.model('Doctor', doctorSchema)

