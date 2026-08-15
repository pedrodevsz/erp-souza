import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import { normalizeTextInput } from '@/lib/text'

const supplierSchema = new Schema(
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

supplierSchema.index({ name: 1 })
supplierSchema.index({ userId: 1, name: 1 }, { unique: true })

export type SupplierModelFields = InferSchemaType<typeof supplierSchema>

export type SupplierDocumentShape = SupplierModelFields & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type SupplierDTO = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export const SupplierModel: Model<SupplierDocumentShape> =
  mongoose.models.Supplier ?? mongoose.model<SupplierDocumentShape>('Supplier', supplierSchema)
