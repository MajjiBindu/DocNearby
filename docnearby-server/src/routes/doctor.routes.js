import { Router } from "express";
import mongoose from "mongoose";
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
const validateDoctorIdParam = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid doctor ID" });
  }

  next();
};

router.get("/", listDoctors);
router.get("/me", requireAuth, requireRole(["doctor", "admin"]), getMyDoctor);
router.get("/:id", getDoctor);
router.put("/:id/availability", requireAuth, requireRole(["doctor", "admin"]), validate(updateDoctorSchema), updateAvailability);
router.put("/:id", requireAuth, requireRole(["doctor", "admin"]), validate(updateDoctorSchema), updateDoctor);
router.get("/:id/slots", validateDoctorIdParam, getDoctorSlots);

export default router;
