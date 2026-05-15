import cron from 'node-cron';
import { Appointment } from '../models/Appointment.js';
import * as emailService from '../services/email.service.js';

/**
 * Core logic for running the appointment reminder job.
 * Extracted so it can be triggered manually or via cron.
 */
export async function runReminderJob() {
  console.log('[JOB] Starting appointment reminder job...');
  let sent = 0;
  let failed = 0;

  try {
    // Calculate date range for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // Query confirmed appointments for tomorrow
    const appointments = await Appointment.find({
      status: 'confirmed',
      date: { $gte: startOfTomorrow, $lte: endOfTomorrow },
    })
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('clinicId', 'name address');

    if (!appointments || appointments.length === 0) {
      console.log('[JOB] No confirmed appointments found for tomorrow.');
      return { sent, failed };
    }

    console.log(`[JOB] Found ${appointments.length} appointments for tomorrow. Sending reminders...`);

    for (const appt of appointments) {
      try {
        const patientEmail = appt.patientId?.email;
        const patientName = appt.patientId?.name || 'Patient';
        
        // Guard doctorId population
        const doctorName = appt.doctorId?.userId?.name || 'Doctor';
        const doctorEmail = appt.doctorId?.userId?.email;
        
        const date = appt.date;
        const slot = appt.slot;

        // Task A: Robust clinicInfo fallback
        const clinicInfo = appt.clinicId?.name
          ? `${appt.clinicId.name}, ${appt.clinicId.address}`
          : `${appt.clinicName || ""} ${appt.location || ""}`.trim() || "See your dashboard";

        // 1. Send reminder to Patient
        if (patientEmail) {
          await emailService.sendAppointmentReminder(patientEmail, { 
            doctorName: `Dr. ${doctorName}`, 
            date, 
            slot, 
            clinicInfo 
          });
          console.log(`[JOB] Sent reminder to patient for appointment ${appt._id}`);
          sent++;
        } else {
          console.warn(`[JOB] Skipping patient reminder for appointment ${appt._id}: Email missing.`);
        }

        // 2. Send reminder to Doctor (Task C)
        if (doctorEmail) {
          await emailService.sendAppointmentReminderToDoctor(doctorEmail, { 
            doctorName: `Dr. ${doctorName}`, 
            date, 
            slot, 
            clinicInfo 
          });
          console.log(`[JOB] Sent reminder to doctor for appointment ${appt._id}`);
          sent++;
        } else {
          console.warn(`[JOB] Skipping doctor reminder for appointment ${appt._id}: Email missing.`);
        }

      } catch (err) {
        console.error(`[JOB] [ERROR] Failed to send reminders for appointment ${appt._id}: ${err.message}`);
        failed++;
      }
    }

    console.log(`[JOB] Reminder job completed. Success: ${sent}, Failures: ${failed}`);
    return { sent, failed };

  } catch (error) {
    console.error('[JOB] [ERROR] Critical error in reminder job:', error.message);
    throw error;
  }
}

/**
 * Appointment Reminder Cron Job
 * Scheduled to run daily at 8:00 AM IST.
 * IST (UTC+5:30) 8:00 AM corresponds to 02:30 AM UTC.
 */
const reminderJob = cron.schedule('30 2 * * *', async () => {
  try {
    await runReminderJob();
  } catch (err) {
    // Cron errors handled in runReminderJob but caught here for safety
  }
}, {
  scheduled: false,
  timezone: "UTC"
});

export { reminderJob };

export const startReminderJob = () => {
  reminderJob.start();
  console.log('[JOB] Appointment reminder job scheduled (08:00 AM IST)');
};
