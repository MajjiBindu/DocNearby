import axios from 'axios'

export async function sendSms({ to, message }) {
  const authKey = process.env.MSG91_AUTH_KEY
  const templateId = process.env.MSG91_TEMPLATE_ID

  if (!authKey || !templateId) {
    // eslint-disable-next-line no-console
    console.log(`[SMS DEV MODE] to=${to} message="${message}"`)
    return { ok: true }
  }

  try {
    // Extract OTP (assuming it's a 4-6 digit number in the message)
    const otpMatch = message.match(/\d{4,6}/)
    const otp = otpMatch ? otpMatch[0] : ''

    const response = await axios.post('https://control.msg91.com/api/v5/otp', {
      template_id: templateId,
      mobile: `91${to}`,
      otp: otp
    }, {
      headers: { authkey: authKey }
    })

    return { ok: response.data.type === 'success' }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MSG91 Error:', error.response?.data || error.message)
    return { ok: false, error: error.message }
  }
}

