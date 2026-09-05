import mongoose from 'mongoose'

import { AppError } from '@/server/errors/app-error'

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongooseCache: MongooseCache | undefined
}

const cached = globalThis.mongooseCache ?? { conn: null, promise: null }

globalThis.mongooseCache = cached

export async function connectToDatabase() {
  if (cached.conn) return cached.conn

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new AppError('Variável de ambiente MONGODB_URI não configurada.', 500)
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
      })
      .catch((error: unknown) => {
        cached.promise = null
        throw new AppError(
          error instanceof Error
            ? `Falha ao conectar ao MongoDB Atlas: ${error.message}`
            : 'Falha ao conectar ao MongoDB Atlas.',
          503
        )
      })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    cached.promise = null
    throw error
  }
}
