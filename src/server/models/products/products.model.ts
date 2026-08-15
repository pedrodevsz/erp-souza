import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import { normalizeTextInput } from '@/lib/text'

const productSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    unit: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    brand: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    product: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    salePrice: { type: Number, required: true, min: 0, default: 0 },
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

productSchema.index({ userId: 1, name: 1, unit: 1, brand: 1 }, { unique: true })

export type ProductModelFields = InferSchemaType<typeof productSchema>

export type ProductDocumentShape = ProductModelFields & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type ProductDTO = {
  id: string
  name: string
  unit: string
  brand: string
  product: string
  salePrice: number
  createdAt: string
  updatedAt: string
}

export const ProductModel: Model<ProductDocumentShape> =
  mongoose.models.Product ?? mongoose.model<ProductDocumentShape>('Product', productSchema)
