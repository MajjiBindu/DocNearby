import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { APPOINTMENT_STATUSES } from "../config/constants.js";
import * as emailService from "../services/email.service.js";

function ok(res, data = {}, message = "") {
  return res.json({ success: true, data, message, error: "" });
}
function fail(res, status, message, error = "") {
  return res.status(status).json({ success: false, data: {}, message, error });
}

export async function createAppointment(req, res) {
  const patientId = req.user?.userId;
  const { doctorId, date, slot } = req.body || {};

  if (!doctorId)
    return fail(res, 400, "doctorId is required", "doctorId required");
  if (!date) return fail(res, 400, "date is required", "date required");
  if (!slot) return fail(res, 400, "slot is required", "slot required");

  const start = new Date(`${date}T00:00:00.000`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return fail(res, 404, "Doctor not found", "doctor_not_found");

  // Identify the day of the week for the slot
  const appointmentDay = new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
  });
  const selectedSlot = doctor.availableSlots?.find(
    (s) => s.day === appointmentDay,
  );
  const hasSlotLocation = selectedSlot?.clinicName || selectedSlot?.location;

  if (!doctor.clinicId && !hasSlotLocation) {
    return fail(
      res,
      400,
      "Doctor has no clinic or location set",
      "clinic_missing",
    );
  }

  const existing = await Appointment.findOne({
    doctorId: doctor._id,
    slot,
    date: { $gte: start, $lt: end },
    status: { $ne: "cancelled" },
  }).select("_id status");

  if (existing) {
    return res.status(409).json({
      success: false,
      data: {},
      message: "Slot already taken",
      error: "slot_taken",
    });
  }

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
      populate: [
        { path: "userId", select: "name email role" },
        { path: "clinicId" },
      ],
    })
    .populate("clinicId");

  // Send confirmation email asynchronously
  const patientEmail = req.user?.email;
  if (patientEmail) {
    const clinicInfo = populated.clinicId
      ? `${populated.clinicId.name}, ${populated.clinicId.address}`
      : `${populated.clinicName || ""} ${populated.location || ""}`.trim() ||
        "Location details in dashboard";

    emailService
      .sendAppointmentConfirmation(patientEmail, {
        doctorName: populated.doctorId?.userId?.name || "Doctor",
        date: populated.date,
        slot: populated.slot,
        clinicInfo,
      })
      .catch((err) =>
        console.error("[ERROR] Failed to send confirmation email:", err),
      );
  }

  // Send notification email to doctor
  const doctorEmail = populated.doctorId?.userId?.email;
  if (doctorEmail) {
    const clinicInfo = populated.clinicId
      ? `${populated.clinicId.name}, ${populated.clinicId.address}`
      : `${populated.clinicName || ""} ${populated.location || ""}`.trim() ||
        "Location details in dashboard";

    emailService
      .sendAppointmentNotificationToDoctor(doctorEmail, {
        patientName: req.user?.name || "Patient",
        doctorName: populated.doctorId?.userId?.name || "Doctor",
        date: populated.date,
        slot: populated.slot,
        clinicName: clinicInfo,
      })
      .catch((err) =>
        console.error("[ERROR] Failed to send doctor notification email:", err),
      );
  }

  return ok(res, { appointment: populated }, "Created");
}

export async function myAppointments(req, res) {
  const patientId = req.user?.userId;
  const appointments = await Appointment.find({ patientId })
    .sort({ date: -1, createdAt: -1 })
    .populate({
      path: "doctorId",
      populate: [
        { path: "userId", select: "name email role" },
        { path: "clinicId" },
      ],
    })
    .populate("clinicId");

  return ok(res, { appointments }, "OK");
}

export async function doctorAppointments(req, res) {
  const userId = req.user?.userId;
  const doctor = await Doctor.findOne({ userId });
  if (!doctor)
    return fail(
      res,
      404,
      "Doctor profile not found",
      "doctor_profile_not_found",
    );

  console.log("Fetching for doctorId:", doctor._id);

  const appointments = await Appointment.find({ doctorId: doctor._id })
    .sort({ date: -1, createdAt: -1 })
    .populate("patientId", "name email role")
    .populate("clinicId")
    .populate({
      path: "doctorId",
      populate: [{ path: "userId", select: "name email role" }],
    });

  console.log("Found appointments:", appointments.length);

  return ok(res, { appointments }, "OK");
}

export async function updateAppointmentStatus(req, res) {
  const { status } = req.body || {};
  if (!APPOINTMENT_STATUSES.includes(status))
    return fail(
      res,
      400,
      "Invalid status",
      "status must be pending/confirmed/cancelled/completed",
    );

  const appt = await Appointment.findById(req.params.id);
  if (!appt)
    return fail(res, 404, "Appointment not found", "appointment_not_found");

  const role = req.user?.role;
  const userId = req.user?.userId;

  if (role === "patient") {
    if (String(appt.patientId) !== String(userId))
      return fail(res, 403, "Forbidden", "not_owner");
    if (status !== "cancelled")
      return fail(res, 400, "Patients can only cancel", "invalid_transition");
  }

  if (role === "doctor") {
    const doctor = await Doctor.findOne({ userId });
    if (!doctor || String(doctor._id) !== String(appt.doctorId))
      return fail(res, 403, "Forbidden", "not_owner");
  }

  appt.status = status;
  await appt.save();

  const updated = await Appointment.findById(appt._id)
    .populate("patientId", "name email role")
    .populate("clinicId")
    .populate({
      path: "doctorId",
      populate: [
        { path: "userId", select: "name email role" },
        { path: "clinicId" },
      ],
    });

  return ok(res, { appointment: updated }, "Updated");
}
