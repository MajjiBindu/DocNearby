import axios from "axios";
import { env } from "../config/constants.js";

function getMsg91Config() {
  return {
    authKey: env("MSG91_AUTH_KEY", ""),
    templateId: env("MSG91_TEMPLATE_ID", ""),
  };
}

export function isMsg91Configured() {
  const { authKey, templateId } = getMsg91Config();
  return Boolean(authKey && templateId);
}

export async function sendOtpSms(mobile, otp) {
  const { authKey, templateId } = getMsg91Config();

  console.log("authKey =", authKey);
  console.log("templateId =", templateId);

  const formattedMobile = mobile.startsWith("91")
    ? mobile
    : `91${mobile}`;

  if (!authKey || !templateId) {
    console.log(`[SMS DEV MODE] mobile=${formattedMobile} otp=${otp}`);
    return { ok: true };
  }

  try {
    await axios.post(
      "https://control.msg91.com/api/v5/otp",
      {
        template_id: templateId,
        mobile: formattedMobile,
        otp,
      },
      {
        headers: {
          authkey: authKey,
          "Content-Type": "application/json",
        },
      },
    );

    return { ok: true };
  } catch (error) {
    console.error(
      "MSG91 send OTP failed:",
      error.response?.data || error.message,
    );

    throw new Error("Failed to send OTP via MSG91");
  }
}

export async function verifyOtpSms(mobile, otp) {
  const { authKey, templateId } = getMsg91Config();

  const formattedMobile = mobile.startsWith("91")
    ? mobile
    : `91${mobile}`;

  if (!authKey || !templateId) {
    return { ok: false, reason: "provider_not_configured" };
  }

  try {
    const response = await axios.get(
      "https://control.msg91.com/api/v5/otp/verify",
      {
        params: {
          authkey: authKey,
          mobile: formattedMobile,
          otp,
          template_id: templateId,
        },
      },
    );

    const payload = response.data || {};

    if (payload.type === "success" || payload.status === "success") {
      return { ok: true };
    }

    return {
      ok: false,
      reason: payload.message || "invalid_otp",
    };
  } catch (error) {
    const payload = error.response?.data;

    return {
      ok: false,
      reason:
        payload?.message ||
        payload?.type ||
        error.message ||
        "verification_failed",
    };
  }
}