import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import { env } from './config/constants.js'
import authRoutes from './routes/auth.routes.js'
import doctorRoutes from './routes/doctor.routes.js'
import clinicRoutes from './routes/clinic.routes.js'
import appointmentRoutes from './routes/appointment.routes.js'
import labRoutes from './routes/lab.routes.js'
import reviewRoutes from './routes/review.routes.js'
import symptomRoutes from './routes/symptom.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { notFound, errorHandler } from './middleware/error.middleware.js'

const app = express()

app.use(
  cors({
    origin: env('CLIENT_URL', 'http://localhost:5173'),
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/clinics', clinicRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/labs', labRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/symptoms', symptomRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
