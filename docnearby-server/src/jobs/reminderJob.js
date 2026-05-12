import cron from 'node-cron';
import { Appointment } from '../models/Appointment.js';
import * as emailService from '../services/email.service.js';

/**
 * Appointment Reminder Cron Job
 * Scheduled to run daily at 8:00 AM IST.
 * IST (UTC+5:30) 8:00 AM corresponds to 02:30 AM UTC.
 */
const reminderJob = cron.schedule('30 2 * * *', async () => {
  console.log('[JOB] Starting daily appointment reminder job...');

  let successCount = 0;
  let failureCount = 0;

  try {
    // 1. Query appointments with status="confirmed" where date is tomorrow (MongoDB date range)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // 2. Populate patientId (name, email) and doctorId (specialty) 
    // clinicName and slot are fields directly on the Appointment model
    const appointments = await Appointment.find({
      status: 'confirmed',
      date: { $gte: startOfTomorrow, $lte: endOfTomorrow },
    })
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
        select: 'specialty userId',
      });

    // Handle edge case: no appointments found -> log and exit silently
    if (!appointments || appointments.length === 0) {
      console.log('[JOB] No confirmed appointments found for tomorrow. Exiting silently.');
      return;
    }

    console.log(`[JOB] Found ${appointments.length} appointments for tomorrow. Sending reminders...`);

    for (const appt of appointments) {
      try {
        const patientEmail = appt.patientId?.email;
        if (!patientEmail) {
          console.warn(`[JOB] Skipping appointment ${appt._id}: Patient email missing.`);
          continue;
        }

        const patientName = appt.patientId?.name || 'Patient';
        const doctorName = appt.doctorId?.userId?.name || 'Doctor';
        const specialty = appt.doctorId?.specialty || 'Medical Specialist';
        const clinic = appt.clinicName || 'Clinic';
        const slotTime = appt.slot;
        const dateStr = appt.date.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // 3. Send reminder email via existing email.service.js
        // Subject: "Reminder: Your appointment tomorrow"
        // Body: doctor name, specialty, clinic, date, slot time
        const subject = "Reminder: Your appointment tomorrow";
        const html = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em;">Appointment Reminder</h1>
            </div>
            <div style="padding: 40px; background-color: #ffffff;">
              <p style="font-size: 16px; margin-bottom: 24px;">Hello <strong>${patientName}</strong>,</p>
              <p style="font-size: 15px; color: #475569; margin-bottom: 32px; line-height: 1.6;">
                This is a friendly reminder for your upcoming appointment scheduled for tomorrow. Please find the details below:
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600; width: 35%;">Doctor</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">Dr. ${doctorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Specialty</td>
                    <td style="padding: 8px 0; color: #0f172a;">${specialty}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Clinic</td>
                    <td style="padding: 8px 0; color: #0f172a;">${clinic}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Date</td>
                    <td style="padding: 8px 0; color: #0f172a;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Time Slot</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${slotTime}</td>
                  </tr>
                </table>
              </div>
              <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
                Please ensure you arrive at least 15 minutes before your scheduled slot. If you need to cancel or reschedule, please do so through the app.
              </p>
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 13px; text-align: center;">
                Best regards,<br/>
                <strong style="color: #475569;">The DocNearby Team</strong>
              </div>
            </div>
          </div>
        `;

        // Using existing emailService.sendEmail signature: { to, subject, html }
        await emailService.sendEmail({ to: patientEmail, subject, html });
        successCount++;
      } catch (err) {
        // 4. Catch per-appointment errors silently
        console.error(`[JOB] Failed to send reminder for appointment ${appt._id}: ${err.message}`);
        failureCount++;
      }
    }

    // 4. Log success/failure counts
    console.log(`[JOB] Reminder job completed. Success: ${successCount}, Failures: ${failureCount}`);
  } catch (error) {
    console.error('[JOB] [ERROR] Critical error in reminder job:', error.message);
  }
}, {
  scheduled: false, // Instance is exported so server.js can start it explicitly
  timezone: "UTC"   // Using UTC because "30 2 * * *" is already converted from IST
});

// 6. Export the cron job instance
export { reminderJob };

// Provide start function for backward compatibility with server.js
export const startReminderJob = () => {
  reminderJob.start();
  console.log('[JOB] Appointment reminder job scheduled (08:00 AM IST)');
};
