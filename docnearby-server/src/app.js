import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";

import { env } from "./config/constants.js";
import authRoutes from "./routes/auth.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import clinicRoutes from "./routes/clinic.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import labRoutes from "./routes/lab.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import symptomRoutes from "./routes/symptom.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import searchRoutes from "./routes/search.routes.js";
import prescriptionRoutes from "./routes/prescription.routes.js";
import medicalRecordRoutes from "./routes/medical-record.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();
app.set("trust proxy", 1); // Render sits behind a reverse proxy; needed for correct client IPs in rate limiting

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" })); // Reduced limit for safety

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Global Rate Limiting
app.use("/api", apiLimiter);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/symptoms", symptomRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/notifications", notificationRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
