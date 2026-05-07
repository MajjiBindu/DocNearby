import { useMemo } from 'react'
import Input from '../common/Input.jsx'

export default function OtpInput({ otp, setOtp }) {
  const cleaned = useMemo(() => String(otp || '').replace(/\D/g, '').slice(0, 6), [otp])
  return (
    <div className="space-y-2">
      <Input
        label="OTP"
        placeholder="6-digit OTP"
        inputMode="numeric"
        value={cleaned}
        onChange={(e) => setOtp(e.target.value)}
      />
      <p className="text-xs text-slate-500">Mock OTP will be logged in the server console.</p>
    </div>
  )
}

