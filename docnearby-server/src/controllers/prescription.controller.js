import { MedicalRecord } from '../models/MedicalRecord.js';
import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import { Notification } from '../models/Notification.js';

/**
 * @desc Create or update a prescription for an appointment
 * @route POST /api/prescriptions
 */
export const createPrescription = asyncHandler(async (req, res) => {
  const { appointmentId, diagnosis, medicines, advice, notes } = req.body;

  // 1. Verify appointment exists
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  // 2. Verify doctor profile exists
  const doctor = await Doctor.findOne({ userId: req.user.userId });
  if (!doctor) {
    throw new AppError("Doctor profile not found", 404);
  }

  // 3. Verify logged-in doctor is assigned to this appointment
  if (String(doctor._id) !== String(appointment.doctorId)) {
    throw new AppError("You do not have permission to prescribe for this appointment", 403);
  }

  // 4. Create or update prescription (idempotent/safe updates)
  let medicalRecord = await MedicalRecord.findOne({ appointmentId });
  if (medicalRecord) {
    medicalRecord.diagnosis = diagnosis;
    medicalRecord.medicines = medicines || [];
    medicalRecord.advice = advice || "";
    medicalRecord.notes = notes || "";
    await medicalRecord.save();
  } else {
    medicalRecord = await MedicalRecord.create({
      patientId: appointment.patientId,
      doctorId: doctor._id,
      appointmentId,
      diagnosis,
      medicines: medicines || [],
      advice: advice || "",
      notes: notes || ""
    });
  }

  // 5. Automatically transition appointment status to prescription_shared
  appointment.status = 'prescription_shared';
  await appointment.save();

  Notification.create({
    userId: appointment.patientId,
    title: 'Prescription Shared',
    message: `Dr. ${doctor.userId.name || 'Your doctor'} has shared a new prescription and medical record.`,
    type: 'prescription',
    referenceId: medicalRecord._id
  }).catch(err => console.error('In-app notification failed', err));

  return sendResponse(res, 201, "Prescription shared successfully", { medicalRecord });
});

/**
 * @desc Get all prescriptions for the logged-in patient
 * @route GET /api/prescriptions/my
 */
export const myPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await MedicalRecord.find({ patientId: req.user.userId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' },
      select: 'specialty'
    })
    .populate('appointmentId', 'date slot clinicName location');

  return sendResponse(res, 200, "Prescriptions fetched successfully", { prescriptions });
});

/**
 * @desc Get prescription for a specific appointment
 * @route GET /api/prescriptions/appointment/:appointmentId
 */
export const getPrescriptionForAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const medicalRecord = await MedicalRecord.findOne({ appointmentId })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' },
      select: 'specialty'
    })
    .populate('appointmentId', 'date slot clinicName location');

  if (!medicalRecord) {
    throw new AppError("Prescription not found for this appointment", 404);
  }

  // Check authorization permissions
  if (req.user.role === 'patient') {
    if (String(medicalRecord.patientId) !== String(req.user.userId)) {
      throw new AppError("Access denied", 403);
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor || String(medicalRecord.doctorId) !== String(doctor._id)) {
      throw new AppError("Access denied", 403);
    }
  }

  return sendResponse(res, 200, "Prescription fetched successfully", { medicalRecord });
});
