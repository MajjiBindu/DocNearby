## DocNearby Server (Express + MongoDB)

Backend API for **DocNearby** — a location-based doctor & small clinic finder with appointment booking (focused on independent local doctors in Tier 2/3 India).

### Tech

- Node.js + Express
- MongoDB + Mongoose (GeoJSON `2dsphere` index on `Clinic.location`)
- JWT auth with email/password credentials
- Email OTP verification through Nodemailer + Gmail SMTP

### Setup

1. Install dependencies.
2. Create `.env` from `.env.example`.
3. Start MongoDB locally.

### Environment variables

See `.env.example`:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRY`
- `EMAIL_USER`
- `EMAIL_PASS`
- `OTP_EXPIRY_MINUTES`
- `CLIENT_URL`

### Gmail SMTP notes

Email OTP uses Nodemailer with Gmail SMTP:

```js
service: "gmail"
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS
}
```

For Gmail accounts with 2-Step Verification enabled, `EMAIL_PASS` must be a Google App Password, not your normal Gmail password. Create one from Google Account -> Security -> App passwords, then put the 16-character app password in `.env`.

The server validates `EMAIL_USER`, `EMAIL_PASS`, and `JWT_SECRET` at startup. If any are missing, startup fails with a readable `[ERROR] Missing required environment variables...` message instead of failing later during signup.

### Run locally

- Dev/start:
  - `npm run dev`
- Seed sample data:
  - `npm run seed`

### Response shape

All API endpoints (except `/api/health`) return:

```json
{ "success": true, "data": {}, "message": "", "error": "" }
```

### API routes

#### Health

- `GET /api/health` → `{ "status": "ok" }`

#### Auth

- `POST /api/auth/signup/request-otp`
- `POST /api/auth/signup/verify-otp`
- `POST /api/auth/login/request-otp`
- `POST /api/auth/login/verify-otp`
- `POST /api/auth/resend-otp`
- `GET /api/auth/me` (protected)

#### Doctors

- `GET /api/doctors` (query: `lat,lng,radius,specialty,language,maxFee`)
- `GET /api/doctors/:id`
- `PUT /api/doctors/:id` (doctor only; updates own profile)
- `GET /api/doctors/:id/slots` (query: `date=YYYY-MM-DD`)

#### Clinics

- `GET /api/clinics` (query: `lat,lng,radius`)
- `GET /api/clinics/:id`
- `POST /api/clinics` (admin only)

#### Appointments

- `POST /api/appointments` (patient only)
- `GET /api/appointments/mine` (patient only)
- `GET /api/appointments/doctor` (doctor only)
- `PATCH /api/appointments/:id/status`
