import nodemailer from "nodemailer";

function createTransporter() {
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Email service is not configured. EMAIL_USER and EMAIL_PASS are required.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function otpTemplate({ title, intro, otp }) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:520px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:28px;">
        <h1 style="margin:0 0 12px; color:#0f172a; font-size:22px;">${title}</h1>
        <p style="margin:0 0 20px; color:#475569; line-height:1.6;">${intro}</p>
        <div style="font-size:32px; letter-spacing:8px; font-weight:700; color:#111827; background:#f1f5f9; border-radius:10px; padding:18px; text-align:center;">
          ${otp}
        </div>
        <p style="margin:20px 0 0; color:#64748b; font-size:13px;">This code expires in 5 minutes. If you did not request it, you can safely ignore this email.</p>
      </div>
    </div>
  `;
}

async function sendOtpEmail({ to, subject, title, intro, otp }) {
  try {
    console.log("[EMAIL] Preparing OTP email", { to, subject });
    const transporter = createTransporter();
    const from = `"DocNearby" <${process.env.EMAIL_USER}>`;

    const result = await transporter.sendMail({
      from,
      to,
      subject,
      html: otpTemplate({ title, intro, otp }),
    });
    console.log("[EMAIL] sendMail success", {
      to,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });
    return result;
  } catch (error) {
    console.error("[ERROR] [EMAIL] Nodemailer sendMail failed:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}

export function sendSignupOtpEmail(email, otp) {
  return sendOtpEmail({
    to: email,
    subject: "Verify your DocNearby account",
    title: "Verify your email",
    intro: "Use this one-time password to finish creating your DocNearby account.",
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
