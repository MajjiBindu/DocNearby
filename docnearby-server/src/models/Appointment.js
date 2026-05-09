import mongoose from 'mongoose'
import { APPOINTMENT_STATUSES } from '../config/constants.js'

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', index: true },
    clinicName: { type: String },
    location: { type: String },
    date: { type: Date, required: true },
    slot: { type: String, required: true },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
)

export const Appointment = mongoose.model('Appointment', appointmentSchema)
