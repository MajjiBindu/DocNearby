import Joi from 'joi';

export const createReviewSchema = Joi.object({
  doctorId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'Invalid doctor ID format',
    'any.required': 'Doctor ID is required'
  }),
  rating: Joi.number().min(1).max(5).required().messages({
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required'
  }),
  comment: Joi.string().trim().max(500).allow('', null).optional()
});
