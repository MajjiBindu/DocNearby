import Input from '../common/Input.jsx'
import Button from '../common/Button.jsx'

export default function PhoneForm({ phone, setPhone, onSend, disabled }) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSend?.()
      }}
    >
      <Input
        label="Phone number"
        placeholder="10-digit mobile number"
        inputMode="numeric"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button type="submit" disabled={disabled}>
        Send OTP
      </Button>
    </form>
  )
}

