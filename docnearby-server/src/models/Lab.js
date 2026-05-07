import mongoose from 'mongoose'

const testSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    homeCollection: { type: Boolean, default: false },
  },
  { _id: false },
)

const labSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
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
    tests: [testSchema],
    openTime: { type: String, default: '07:00' },
    closeTime: { type: String, default: '20:00' },
    rating: { type: Number, default: 0 },
  },
  { versionKey: false },
)

labSchema.index({ location: '2dsphere' })

export const Lab = mongoose.model('Lab', labSchema)

