import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneForm from '../components/auth/PhoneForm.jsx'
import OtpInput from '../components/auth/OtpInput.jsx'
import Button from '../components/common/Button.jsx'
import Input from '../components/common/Input.jsx'
import { authApi } from '../services/api.js'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuth()

  const [role, setRole] = useState('patient')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // phone | otp
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const cleanedPhone = useMemo(() => String(phone || '').replace(/\D/g, '').slice(0, 10), [phone])

  const handlePhoneChange = (val) => {
    setPhone(val)
    if (phoneError) setPhoneError('')
    if (message) setMessage('')
  }

  const send = async () => {
    if (!cleanedPhone) {
      setPhoneError('Phone number is required.')
      return
    }
    if (cleanedPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number.')
      return
    }

    setLoading(true)
    setMessage('')
    setPhoneError('')
    try {
      const res = await authApi.sendOtp({ phone: cleanedPhone, role })
      if (res?.success) {
        setStep('otp')
        setMessage(res.message || 'OTP sent successfully.')
      } else setMessage(res?.message || 'Failed to send OTP. Please try again.')
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || 'Failed to send OTP.')
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await authApi.verifyOtp({ phone: cleanedPhone, otp, role, name })
      if (res?.success) {
        setToken(res.data?.token || '')
        setUser(res.data?.user || null)
        navigate(role === 'doctor' ? '/doctor' : '/patient', { replace: true })
      } else setMessage(res?.message || 'Invalid OTP')
    } catch (e) {
      setMessage(e?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
          <p className="mt-1 text-sm text-slate-600">Mock OTP login for patients and doctors.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">Role</span>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={step === 'otp'}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </label>
          <Input
            label="Name (optional)"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={step === 'otp'}
          />
        </div>

        {step === 'phone' ? (
          <div className="space-y-1">
            <PhoneForm phone={cleanedPhone} setPhone={handlePhoneChange} onSend={send} disabled={loading} />
            {phoneError && <p className="text-xs font-medium text-red-600 animate-in fade-in slide-in-from-top-1">{phoneError}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <OtpInput otp={otp} setOtp={setOtp} />
            <div className="flex gap-2">
              <Button type="button" onClick={verify} disabled={loading}>
                Verify OTP
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStep('phone')
                  setOtp('')
                  setMessage('')
                }}
                disabled={loading}
              >
                Change phone
              </Button>
            </div>
          </div>
        )}

        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      </div>
    </div>
  )
}

