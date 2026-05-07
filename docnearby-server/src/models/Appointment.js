import mongoose from 'mongoose'
import { APPOINTMENT_STATUSES } from '../config/constants.js'

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true, index: true },
    date: { type: Date, required: true },
    slot: { type: String, required: true },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'pending' },
    smsConfirmationSent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
)

export const Appointment = mongoose.model('Appointment', appointmentSchema)

