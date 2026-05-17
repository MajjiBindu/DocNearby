import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import AppError from '../utils/AppError.js';
import * as emailService from './email.service.js';

export const create = async (patientData, appointmentData) => {
  const { doctorId, date, slot } = appointmentData;
  const patientId = patientData.userId;

  const start = new Date(`${date}T00:00:00.000`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new AppError('Doctor not found', 404);

  const appointmentDay = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
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
    status: "pending",
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
    .populate("patientId", "name email")
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

  return await Appointment.findById(appt._id)
    .populate("patientId", "name email role")
    .populate("clinicId")
    .populate({
      path: "doctorId",
      populate: [{ path: "userId", select: "name email role" }, { path: "clinicId" }],
    });
};
