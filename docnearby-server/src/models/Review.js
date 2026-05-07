import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
)

// Enforce one review per patient per doctor
reviewSchema.index({ patientId: 1, doctorId: 1 }, { unique: true })

export const Review = mongoose.model('Review', reviewSchema)
