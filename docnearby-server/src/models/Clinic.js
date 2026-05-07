import mongoose from 'mongoose'

const clinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
    },
    phone: { type: String, default: '' },
    doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  },
  { versionKey: false },
)

clinicSchema.index({ location: '2dsphere' })

export const Clinic = mongoose.model('Clinic', clinicSchema)

