import { env } from '../config/constants.js'
import { sendSms } from './sms.service.js'

const store = new Map() // phone -> { otp, expiresAt, attempts }

function nowMs() {
  return Date.now()
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function expiryMs() {
  const minutes = Number(env('OTP_EXPIRY_MINUTES', 5))
  return minutes * 60 * 1000
}

export function getOtpDebug(phone) {
  return store.get(phone)
}

export async function sendOtp(phone) {
  const otp = generateOtp()
  const record = { otp, expiresAt: new Date(nowMs() + expiryMs()), attempts: 0 }
  store.set(phone, record)

  // eslint-disable-next-line no-console
  console.log(`[OTP] phone=${phone} otp=${otp} expiresAt=${record.expiresAt.toISOString()}`)

  await sendSms({ to: phone, message: `Your DocNearby OTP is ${otp}. Valid for 5 minutes.` })

  return { expiresAt: record.expiresAt }
}

export function verifyOtp(phone, otp) {
  const record = store.get(phone)
  if (!record) return { ok: false, reason: 'no_otp' }

  if (record.attempts >= 3) return { ok: false, reason: 'max_attempts' }

  if (new Date() > record.expiresAt) {
    store.delete(phone)
    return { ok: false, reason: 'expired' }
  }

  record.attempts += 1

  if (String(otp) !== String(record.otp)) {
    return { ok: false, reason: 'invalid' }
  }

  store.delete(phone)
  return { ok: true }
}

