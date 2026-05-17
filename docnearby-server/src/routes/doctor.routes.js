import { Router } from "express";
import {
  getDoctor,
  getDoctorSlots,
  getMyDoctor,
  listDoctors,
  updateAvailability,
  updateDoctor,
} from "../controllers/doctor.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { updateDoctorSchema } from "../validators/doctor.validator.js";

const router = Router();

router.get("/", listDoctors);
router.get("/me", requireAuth, requireRole(["doctor", "admin"]), getMyDoctor);
router.get("/:id", getDoctor);
router.put("/:id/availability", requireAuth, requireRole(["doctor", "admin"]), validate(updateDoctorSchema), updateAvailability);
router.patch("/:id/availability", requireAuth, requireRole(["doctor", "admin"]), validate(updateDoctorSchema), updateAvailability);
router.put("/:id", requireAuth, requireRole(["doctor", "admin"]), validate(updateDoctorSchema), updateDoctor);
router.patch("/:id", requireAuth, requireRole(["doctor", "admin"]), validate(updateDoctorSchema), updateDoctor);
router.get("/:id/slots", getDoctorSlots);

export default router;
