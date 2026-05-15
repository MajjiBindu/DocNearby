import nodemailer from "nodemailer";

function createTransporter() {
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "Email service is not configured. EMAIL_USER and EMAIL_PASS are required.",
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function appointmentTemplate({ title, intro, details }) {
  const detailRows = Object.entries(details)
    .map(
      ([label, value]) => `
      <div style="margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <span style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px;">${label}</span>
        <span style="color: #0f172a; font-size: 16px; font-weight: 600;">${value}</span>
      </div>
    `,
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:28px;">
        <h1 style="margin:0 0 12px; color:#0f172a; font-size:22px;">${title}</h1>
        <p style="margin:0 0 24px; color:#475569; line-height:1.6;">${intro}</p>
        <div style="background:#f8fafc; border-radius:10px; padding:20px; margin-bottom:24px;">
          ${detailRows}
        </div>
        <p style="margin:0; color:#64748b; font-size:13px; text-align:center;">If you have any questions, please contact our support team.</p>
      </div>
    </div>
  `;
}

export async function sendEmail({ to, subject, html }) {
  try {
    const transporter = createTransporter();
    const from = `"DocNearby" <${process.env.EMAIL_USER}>`;

    const result = await transporter.sendMail({ from, to, subject, html });
    console.log("[EMAIL] sendMail success", {
      to,
      messageId: result.messageId,
    });
    return result;
  } catch (error) {
    console.error("[ERROR] [EMAIL] Nodemailer sendMail failed:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

function otpTemplate({ title, intro, otp }) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:420px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:28px;">
        <h1 style="margin:0 0 12px; color:#0f172a; font-size:22px;">${title}</h1>
        <p style="margin:0 0 24px; color:#475569; line-height:1.6;">${intro}</p>
        <div style="background:#f1f5f9; border-radius:8px; padding:16px; text-align:center; margin-bottom:24px;">
          <span style="font-size:32px; font-weight:900; letter-spacing:8px; color:#6366f1;">${otp}</span>
        </div>
        <p style="margin:0; color:#64748b; font-size:13px; text-align:center;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;
}

async function sendOtpEmail({ to, subject, title, intro, otp }) {
  return sendEmail({
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0f2862;">${title}</h2>
        <p style="color: #4f5f76;">${intro}</p>
        <div style="margin: 32px 0; text-align: center;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #9e363a;">${otp}</span>
        </div>
        <p style="color: #4f5f76; font-size: 13px;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
        <p style="color: #4f5f76; font-size: 12px;">— DocNearby Team</p>
      </div>
    `,
  });
}

export function sendSignupOtpEmail(email, otp) {
  return sendOtpEmail({
    to: email,
    subject: "Verify your DocNearby account",
    title: "Verify your email",
    intro:
      "Use this one-time password to finish creating your DocNearby account.",
    otp,
  });
}

export function sendLoginOtpEmail(email, otp) {
  return sendOtpEmail({
    to: email,
    subject: "Your DocNearby login code",
    title: "Confirm your login",
    intro: "Use this one-time password to complete your DocNearby login.",
    otp,
  });
}

export function sendAppointmentConfirmation(
  to,
  { doctorName, date, slot, clinicInfo },
) {
  return sendEmail({
    to,
    subject: `Booking Confirmed: ${doctorName}`,
    html: appointmentTemplate({
      title: "Appointment Confirmed",
      intro: `Your appointment with ${doctorName} has been successfully booked.`,
      details: {
        Doctor: doctorName,
        Date: new Date(date).toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        Time: slot,
        Location: clinicInfo,
      },
    }),
  });
}

export function sendAppointmentNotificationToDoctor(
  to,
  { patientName, doctorName, date, slot, clinicName },
) {
  return sendEmail({
    to,
    subject: `New Booking: ${patientName}`,
    html: appointmentTemplate({
      title: "New Appointment Booked",
      intro: `A new appointment has been booked with you.`,
      details: {
        Patient: patientName,
        Doctor: doctorName,
        Date: new Date(date).toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        Time: slot,
        Location: clinicName,
      },
    }),
  });
}

export function sendAppointmentReminder(
  to,
  { doctorName, date, slot, clinicInfo },
) {
  return sendEmail({
    to,
    subject: `Reminder: Appointment with ${doctorName} tomorrow`,
    html: appointmentTemplate({
      title: "Upcoming Appointment",
      intro: `This is a friendly reminder of your appointment scheduled for tomorrow.`,
      details: {
        Doctor: doctorName,
        Date: new Date(date).toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        Time: slot,
        Location: clinicInfo,
      },
    }),
  });
}

export function sendAppointmentReminderToDoctor(
  to,
  { doctorName, date, slot, clinicInfo },
) {
  return sendEmail({
    to,
    subject: `Reminder: You have an appointment tomorrow`,
    html: appointmentTemplate({
      title: "Appointment Reminder",
      intro: `You have an appointment scheduled for tomorrow.`,
      details: {
        Doctor: doctorName,
        Date: new Date(date).toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        Time: slot,
        Location: clinicInfo,
      },
    }),
  });
}

export function sendDoctorVerifiedEmail(to, { doctorName }) {
  return sendEmail({
    to,
    subject: "Your DocNearby profile is verified",
    html: appointmentTemplate({
      title: "Profile Verified",
      intro: `Hello Dr. ${doctorName}, we are pleased to inform you that your profile on DocNearby has been verified.`,
      details: {
        Status: "Verified ✓",
        "Next step": "Log in and complete your profile",
      },
    }),
  });
}

export function sendDoctorRejectedEmail(to, { doctorName, reason }) {
  return sendEmail({
    to,
    subject: "DocNearby profile review update",
    html: appointmentTemplate({
      title: "Profile Review Update",
      intro: `Hello Dr. ${doctorName}, thank you for your interest in DocNearby.`,
      details: {
        Status: "Not approved",
        Reason: reason || "Does not meet verification criteria",
      },
    }),
  });
}
