import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import AppError from '../utils/AppError.js';
import * as emailService from './email.service.js';
import { Notification } from '../models/Notification.js';

export const create = async (patientData, appointmentData) => {
  const { doctorId, date, slot } = appointmentData;
  const patientId = patientData.userId;

  const start = new Date(`${date}T00:00:00.000`);
  if (isNaN(start.getTime())) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD.', 400, 'invalid_date');
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new AppError('Doctor not found', 404);

  if (Array.isArray(doctor.blockedDates) && doctor.blockedDates.includes(date)) {
    throw new AppError('Doctor is on leave or unavailable on this date', 400, 'doctor_blocked');
  }

  // Validate onboarding completeness before allowing bookings
  const hasPhoto = !!doctor.profilePhoto;
  const hasQualifications = Array.isArray(doctor.qualifications) && doctor.qualifications.length > 0;
  const hasClinic = !!doctor.clinicId;
  const hasAvailability = Array.isArray(doctor.availableSlots) && doctor.availableSlots.length > 0;
  const hasBio = !!doctor.bio && doctor.bio.trim().length > 0;

  if (!(hasPhoto && hasQualifications && hasClinic && hasAvailability && hasBio)) {
    throw new AppError('Doctor onboarding is incomplete. Booking is disabled.', 400);
  }

  const [yyyy, mm, dd] = date.split("-").map(Number);
  const appointmentDay = new Date(yyyy, mm - 1, dd).toLocaleDateString("en-US", { weekday: "short" });
  const selectedSlot = doctor.availableSlots?.find(s => s.day === appointmentDay);
  const hasSlotLocation = selectedSlot?.clinicName || selectedSlot?.location;

  if (!doctor.clinicId && !hasSlotLocation) {
    throw new AppError('Doctor has no clinic or location set', 400);
  }

  const existing = await Appointment.findOne({
    doctorId: doctor._id,
    slot,
    date: { $gte: start, $lt: end },
    status: { $ne: "cancelled" },
  });

  if (existing) throw new AppError('Slot already taken', 409, 'slot_taken');

  const appt = await Appointment.create({
    patientId,
    doctorId: doctor._id,
    clinicId: doctor.clinicId || null,
    clinicName: selectedSlot?.clinicName || null,
    location: selectedSlot?.location || null,
    date: start,
    slot,
    status: "booked",
  });

  const populated = await Appointment.findById(appt._id)
    .populate({
      path: "doctorId",
      populate: [{ path: "userId", select: "name email role" }, { path: "clinicId" }],
    })
    .populate("clinicId");

  // Notifications (Async)
  const clinicInfo = populated.clinicId
    ? `${populated.clinicId.name}, ${populated.clinicId.address}`
    : `${populated.clinicName || ""} ${populated.location || ""}`.trim() || "Location details in dashboard";

  if (patientData.email) {
    emailService.sendAppointmentConfirmation(patientData.email, {
      doctorName: populated.doctorId?.userId?.name || "Doctor",
      date: populated.date,
      slot: populated.slot,
      clinicInfo,
    }).catch(err => console.error('Email failed', err));
  }

  if (populated.doctorId?.userId?.email) {
    emailService.sendAppointmentNotificationToDoctor(populated.doctorId.userId.email, {
      patientName: patientData.name || "Patient",
      doctorName: populated.doctorId.userId.name || "Doctor",
      date: populated.date,
      slot: populated.slot,
      clinicName: clinicInfo,
    }).catch(err => console.error('Doctor notification failed', err));
  }

  Notification.create({
    userId: populated.doctorId.userId._id,
    title: 'New Booking',
    message: `New booking from ${patientData.name || 'a patient'} on ${populated.date.toLocaleDateString()} at ${populated.slot}.`,
    type: 'booking',
    referenceId: appt._id
  }).catch(err => console.error('In-app notification failed', err));

  return populated;
};

export const findByPatient = async (patientId) => {
  return await Appointment.find({ patientId })
    .sort({ date: -1, createdAt: -1 })
    .populate({
      path: "doctorId",
      populate: [{ path: "userId", select: "name email role" }, { path: "clinicId", select: "name address city" }],
      select: "specialty userId clinicId"
    })
    .populate("clinicId", "name address city")
    .select("doctorId clinicId clinicName location date slot status createdAt");
};

export const findByDoctor = async (doctorId) => {
  return await Appointment.find({ doctorId })
    .sort({ date: -1, createdAt: -1 })
    .populate("patientId", "name email patientProfile")
    .populate("clinicId", "name city")
    .populate({
      path: "doctorId",
      populate: [{ path: "userId", select: "name email" }],
      select: "userId"
    })
    .select("patientId clinicId date slot status createdAt");
};

export const updateStatus = async (appointmentId, status, user) => {
  const appt = await Appointment.findById(appointmentId);
  if (!appt) throw new AppError('Appointment not found', 404);

  if (user.role === "patient") {
    if (String(appt.patientId) !== String(user.userId)) throw new AppError('Forbidden', 403);
    if (status !== "cancelled") throw new AppError('Patients can only cancel', 400);
  }

  if (user.role === "doctor") {
    const doctor = await Doctor.findOne({ userId: user.userId });
    if (!doctor || String(doctor._id) !== String(appt.doctorId)) throw new AppError('Forbidden', 403);
  }

  appt.status = status;
  await appt.save();

  const populatedAppt = await Appointment.findById(appt._id)
    .populate("patientId", "name email role")
    .populate("clinicId")
    .populate({
      path: "doctorId",
      populate: [{ path: "userId", select: "name email role" }, { path: "clinicId" }],
    });

  if (status === 'confirmed') {
    Notification.create({
      userId: populatedAppt.patientId._id,
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${populatedAppt.doctorId.userId.name} on ${populatedAppt.date.toLocaleDateString()} at ${populatedAppt.slot} has been confirmed.`,
      type: 'appointment',
      referenceId: appt._id
    }).catch(err => console.error('In-app notification failed', err));
  }

  return populatedAppt;
};

export const reschedule = async (appointmentId, newDate, newSlot, user) => {
  const appt = await Appointment.findById(appointmentId);
  if (!appt) throw new AppError('Appointment not found', 404);

  // Authorization check
  if (user.role === "patient") {
    if (String(appt.patientId) !== String(user.userId)) throw new AppError('Forbidden', 403);
  } else if (user.role === "doctor") {
    const doctor = await Doctor.findOne({ userId: user.userId });
    if (!doctor || String(doctor._id) !== String(appt.doctorId)) throw new AppError('Forbidden', 403);
  } else if (user.role !== "admin") {
    throw new AppError('Forbidden', 403);
  }

  // Prevent rescheduling completed/cancelled/prescription_shared appointments
  if (['cancelled', 'completed', 'prescription_shared'].includes(appt.status)) {
    throw new AppError('Cannot reschedule completed or cancelled appointments', 400);
  }

  const start = new Date(`${newDate}T00:00:00.000`);
  if (isNaN(start.getTime())) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD.', 400, 'invalid_date');
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const doctor = await Doctor.findById(appt.doctorId);
  if (!doctor) throw new AppError('Doctor not found', 404);

  // Check doctor blocked dates
  if (Array.isArray(doctor.blockedDates) && doctor.blockedDates.includes(newDate)) {
    throw new AppError('Doctor is on leave or unavailable on this date', 400, 'doctor_blocked');
  }

  // Onboarding completeness validation
  const hasPhoto = !!doctor.profilePhoto;
  const hasQualifications = Array.isArray(doctor.qualifications) && doctor.qualifications.length > 0;
  const hasClinic = !!doctor.clinicId;
  const hasAvailability = Array.isArray(doctor.availableSlots) && doctor.availableSlots.length > 0;
  const hasBio = !!doctor.bio && doctor.bio.trim().length > 0;

  if (!(hasPhoto && hasQualifications && hasClinic && hasAvailability && hasBio)) {
    throw new AppError('Doctor onboarding is incomplete. Rescheduling is disabled.', 400);
  }

  // Get new slot day/clinic info
  const [yyyy, mm, dd] = newDate.split("-").map(Number);
  const appointmentDay = new Date(yyyy, mm - 1, dd).toLocaleDateString("en-US", { weekday: "short" });
  const selectedSlot = doctor.availableSlots?.find(s => s.day === appointmentDay);
  const hasSlotLocation = selectedSlot?.clinicName || selectedSlot?.location;

  if (!doctor.clinicId && !hasSlotLocation) {
    throw new AppError('Doctor has no clinic or location set', 400);
  }

  // Prevent race conditions: Check if slot is taken by another appointment
  const existing = await Appointment.findOne({
    _id: { $ne: appt._id },
    doctorId: doctor._id,
    slot: newSlot,
    date: { $gte: start, $lt: end },
    status: { $ne: "cancelled" },
  });

  if (existing) throw new AppError('Slot already taken', 409, 'slot_taken');

  // Update appointment details
  appt.date = start;
  appt.slot = newSlot;
  appt.clinicId = doctor.clinicId || null;
  appt.clinicName = selectedSlot?.clinicName || null;
  appt.location = selectedSlot?.location || null;
  appt.status = "booked"; // Reset to booked status upon rescheduling

  await appt.save();

  const populated = await Appointment.findById(appt._id)
    .populate({
      path: "doctorId",
      populate: [{ path: "userId", select: "name email role" }, { path: "clinicId" }],
    })
    .populate("clinicId")
    .populate("patientId", "name email");

  // Send notifications
  const clinicInfo = populated.clinicId
    ? `${populated.clinicId.name}, ${populated.clinicId.address}`
    : `${populated.clinicName || ""} ${populated.location || ""}`.trim() || "Location details in dashboard";

  const patientEmail = populated.patientId?.email;
  const patientName = populated.patientId?.name || "Patient";

  if (patientEmail) {
    emailService.sendAppointmentConfirmation(patientEmail, {
      doctorName: populated.doctorId?.userId?.name || "Doctor",
      date: populated.date,
      slot: populated.slot,
      clinicInfo,
    }).catch(err => console.error('Reschedule Email to Patient failed', err));
  }

  if (populated.doctorId?.userId?.email) {
    emailService.sendAppointmentNotificationToDoctor(populated.doctorId.userId.email, {
      patientName,
      doctorName: populated.doctorId.userId.name || "Doctor",
      date: populated.date,
      slot: populated.slot,
      clinicName: clinicInfo,
    }).catch(err => console.error('Reschedule Email to Doctor failed', err));
  }

  Notification.create({
    userId: populated.doctorId.userId._id,
    title: 'Appointment Rescheduled',
    message: `${patientName} rescheduled their appointment to ${populated.date.toLocaleDateString()} at ${populated.slot}.`,
    type: 'booking',
    referenceId: appt._id
  }).catch(err => console.error('In-app notification failed', err));

  return populated;
};

