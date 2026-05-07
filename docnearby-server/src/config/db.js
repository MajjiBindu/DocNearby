import mongoose from 'mongoose'
import { env } from './constants.js'

export async function connectDb() {
  const uri = env('MONGO_URI')
  if (!uri) throw new Error('MONGO_URI is required')

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, { autoIndex: true })
  // eslint-disable-next-line no-console
  console.log('MongoDB connected')
}

