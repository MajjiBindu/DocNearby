## DocNearby Server (Express + MongoDB)

Backend API for **DocNearby** — a location-based doctor & small clinic finder with appointment booking (focused on independent local doctors in Tier 2/3 India).

### Tech

- Node.js + Express
- MongoDB + Mongoose (GeoJSON `2dsphere` index on `Clinic.location`)
- JWT auth
- Mock OTP (logged to console; stored in-memory)

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
- `OTP_EXPIRY_MINUTES`
- `CLIENT_URL`

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

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
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

