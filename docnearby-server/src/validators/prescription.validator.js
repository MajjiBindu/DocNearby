import Joi from 'joi';

export const createPrescriptionSchema = Joi.object({
  appointmentId: Joi.string().required(),
  diagnosis: Joi.string().required(),
  medicines: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      dosage: Joi.string().allow('', null).optional().default(''),
      frequency: Joi.string().allow('', null).optional().default(''),
      duration: Joi.string().allow('', null).optional().default('')
    })
  ).optional().default([]),
  advice: Joi.string().allow('', null).optional().default(''),
  notes: Joi.string().allow('', null).optional().default('')
});
