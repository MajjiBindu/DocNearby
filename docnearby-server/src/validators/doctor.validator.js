import Joi from 'joi';

export const updateDoctorSchema = Joi.object({
  specialty: Joi.string().trim().min(2).max(100),
  profilePhoto: Joi.string().allow("", null).trim(),
  bio: Joi.string().allow("", null).trim(),
  qualifications: Joi.array().items(Joi.string().trim()),
  languages: Joi.array().items(Joi.string().trim()),
  consultationFee: Joi.number().min(0).max(100000),
  experience: Joi.number().min(0).max(70),
  clinicId: Joi.string().hex().length(24),
  availableSlots: Joi.array().items(Joi.object({
    day: Joi.string().valid("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat").required(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):?([0-5]\d)$/).required(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):?([0-5]\d)$/).required(),
    slotDuration: Joi.number().min(5).max(120).default(30),
    clinicName: Joi.string().allow("", null).trim(),
    location: Joi.string().allow("", null).trim()
  })),
  blockedDates: Joi.array().items(Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)).unique()
}).min(1);
