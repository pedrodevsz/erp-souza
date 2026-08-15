import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'

import { normalizeTextInput } from '@/lib/text'
import type { UserRole } from '@/types/user'

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true, unique: true, set: normalizeTextInput },
    passwordHash: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['ADMIN', 'USER'],
      default: 'USER',
      index: true,
    },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc: unknown, ret: Record<string, unknown> & { _id?: unknown; id?: string }) => {
        ret.id = String(ret._id)
        delete ret._id
        return ret
      },
    },
  }
)

export type UserModelFields = InferSchemaType<typeof userSchema>

export type UserDocumentShape = UserModelFields & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type UserDTO = {
  id: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const UserModel: Model<UserDocumentShape> =
  mongoose.models.User ?? mongoose.model<UserDocumentShape>('User', userSchema)
