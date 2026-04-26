import mongoose from 'mongoose'

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured in backend/.env')
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 8000,
  })

  console.log('MongoDB connected successfully')
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1
}
