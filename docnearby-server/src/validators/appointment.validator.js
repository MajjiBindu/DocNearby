import Joi from 'joi';
import { APPOINTMENT_STATUSES } from '../config/constants.js';

export const createAppointmentSchema = Joi.object({
  doctorId: Joi.string().required(),
  date: Joi.string().isoDate().required(),
  slot: Joi.string().required(),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...APPOINTMENT_STATUSES).required(),
});
