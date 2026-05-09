import cron from 'node-cron'
import { Appointment } from '../models/Appointment.js'
import * as emailService from '../services/email.service.js'

export function startReminderJob() {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[JOB] Starting daily appointment reminder job')

    try {
      const tomorrowStart = new Date()
      tomorrowStart.setDate(tomorrowStart.getDate() + 1)
      tomorrowStart.setHours(0, 0, 0, 0)

      const tomorrowEnd = new Date(tomorrowStart)
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)

      const appointments = await Appointment.find({
        date: { $gte: tomorrowStart, $lt: tomorrowEnd },
        status: 'confirmed',
      })
        .populate('patientId', 'name email')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' },
        })
        .populate('clinicId', 'name address')

      console.log(`[JOB] Found ${appointments.length} appointments for tomorrow`)

      for (const appt of appointments) {
        const patientEmail = appt.patientId?.email
        if (!patientEmail) continue

        try {
          await emailService.sendAppointmentReminder(patientEmail, {
            doctorName: appt.doctorId?.userId?.name || 'Doctor',
            date: appt.date,
            slot: appt.slot,
            clinicInfo: `${appt.clinicId?.name}, ${appt.clinicId?.address}`,
          })
          console.log(`[JOB] Sent reminder to ${patientEmail}`)
        } catch (err) {
          console.error(`[JOB] [ERROR] Failed to send reminder to ${patientEmail}:`, err.message)
        }
      }

      console.log('[JOB] Daily reminder job completed')
    } catch (error) {
      console.error('[JOB] [ERROR] Reminder job failed:', error.message)
    }
  })

  console.log('[JOB] Appointment reminder job scheduled (0 8 * * *)')
}
