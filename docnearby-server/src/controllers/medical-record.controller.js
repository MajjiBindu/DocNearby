import { MedicalRecord } from '../models/MedicalRecord.js';
import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';

/**
 * @desc Create medical record
 * @route POST /api/medical-records
 */
export const createRecord = asyncHandler(async (req, res) => {
  const { appointmentId, diagnosis, medicines, advice, notes, pdfs, labReportId } = req.body;

  const doctor = await Doctor.findOne({ userId: req.user.userId });
  if (!doctor) throw new AppError('Doctor profile not found', 404);

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404);

  if (String(appointment.doctorId) !== String(doctor._id)) {
    throw new AppError('Unauthorized: This appointment is not assigned to you', 403);
  }

  // Idempotently check if record already exists for this appointment
  let record = await MedicalRecord.findOne({ appointmentId: appointment._id });

  if (record) {
    record.diagnosis = diagnosis;
    record.medicines = medicines || [];
    record.advice = advice || "";
    record.notes = notes || "";
    record.pdfs = pdfs || [];
    record.labReportId = labReportId || undefined;
    await record.save();
  } else {
    record = await MedicalRecord.create({
      patientId: appointment.patientId,
      doctorId: doctor._id,
      appointmentId: appointment._id,
      diagnosis,
      medicines: medicines || [],
      advice: advice || "",
      notes: notes || "",
      pdfs: pdfs || [],
      labReportId: labReportId || undefined,
    });
  }

  // Auto-advance appointment status to prescription_shared
  appointment.status = 'prescription_shared';
  await appointment.save();

  return sendResponse(res, 200, "Medical record created successfully", { record });
});

/**
 * @desc Get paginated medical records for the logged-in patient
 * @route GET /api/medical-records/patient
 */
export const getPatientRecords = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = { patientId: req.user.userId };

  const total = await MedicalRecord.countDocuments(query);
  const records = await MedicalRecord.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name email role' }
    })
    .populate('appointmentId');

  return sendResponse(res, 200, "Medical records fetched successfully", {
    records,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc Get paginated medical records of a patient (Doctor access)
 * @route GET /api/medical-records/doctor/patient/:patientId
 */
export const getDoctorPatientRecords = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const doctor = await Doctor.findOne({ userId: req.user.userId });
  if (!doctor) throw new AppError('Doctor profile not found', 404);

  // Authorization Check: Has the doctor ever had an appointment with this patient?
  const hasAppointment = await Appointment.exists({
    doctorId: doctor._id,
    patientId: patientId
  });

  if (!hasAppointment) {
    throw new AppError("Access Denied: You are only authorized to access records of patients who have consulted with you.", 403);
  }

  const query = { patientId: patientId };

  const total = await MedicalRecord.countDocuments(query);
  const records = await MedicalRecord.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name email role' }
    })
    .populate('appointmentId');

  return sendResponse(res, 200, "Patient records fetched successfully", {
    records,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc Get single medical record details
 * @route GET /api/medical-records/:id
 */
export const getRecordDetails = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name email role' }
    })
    .populate('appointmentId');

  if (!record) throw new AppError('Medical record not found', 404);

  // Authorization Checks
  if (req.user.role === 'patient') {
    if (String(record.patientId) !== String(req.user.userId)) {
      throw new AppError('Access Denied: You cannot view other patients records', 403);
    }
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    if (!doctor) throw new AppError('Doctor profile not found', 404);

    // Doctor can access if they wrote it, OR if they are authorized via prior consults
    const isOwner = String(record.doctorId) === String(doctor._id);
    const hasConsultation = await Appointment.exists({
      doctorId: doctor._id,
      patientId: record.patientId
    });

    if (!isOwner && !hasConsultation) {
      throw new AppError('Access Denied: You are not authorized to view this record', 403);
    }
  }

  return sendResponse(res, 200, "Medical record details fetched successfully", { record });
});
