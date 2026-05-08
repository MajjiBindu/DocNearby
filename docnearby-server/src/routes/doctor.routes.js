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

const router = Router();

router.get("/", (req, res, next) =>
  Promise.resolve(listDoctors(req, res)).catch(next),
);
router.get(
  "/me",
  requireAuth,
  requireRole(["doctor", "admin"]),
  (req, res, next) => Promise.resolve(getMyDoctor(req, res)).catch(next),
);
router.get("/:id", (req, res, next) =>
  Promise.resolve(getDoctor(req, res)).catch(next),
);
router.put(
  "/:id/availability",
  requireAuth,
  requireRole(["doctor", "admin"]),
  (req, res, next) => Promise.resolve(updateAvailability(req, res)).catch(next),
);
router.put(
  "/:id",
  requireAuth,
  requireRole(["doctor", "admin"]),
  (req, res, next) => Promise.resolve(updateDoctor(req, res)).catch(next),
);
router.get("/:id/slots", (req, res, next) =>
  Promise.resolve(getDoctorSlots(req, res)).catch(next),
);

export default router;
