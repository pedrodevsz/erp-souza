import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import { normalizeTextInput } from '@/lib/text'

const inventoryCategorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
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

inventoryCategorySchema.index({ userId: 1, name: 1 }, { unique: true })

export type InventoryCategoryModelFields = InferSchemaType<typeof inventoryCategorySchema>

export type InventoryCategoryDocumentShape = InventoryCategoryModelFields & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type InventoryCategoryDTO = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export const InventoryCategoryModel: Model<InventoryCategoryDocumentShape> =
  mongoose.models.InventoryCategory ??
  mongoose.model<InventoryCategoryDocumentShape>('InventoryCategory', inventoryCategorySchema)
