import mongoose, { Schema, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose'
import { normalizeTextInput } from '@/lib/text'

const productReservationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: String, required: true, trim: true, index: true },
    inventoryId: { type: String, required: true, trim: true, index: true },
    productName: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    product: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    sku: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    unit: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    customerId: { type: String, required: true, trim: true, index: true },
    customerName: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    quantity: { type: Number, required: true, min: 1 },
    reservedAt: { type: String, required: true, trim: true, index: true },
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

productReservationSchema.index({ productId: 1, customerId: 1, reservedAt: -1 })
productReservationSchema.index({ userId: 1, productId: 1, customerId: 1, reservedAt: -1 })

export type ProductReservationModelFields = InferSchemaType<typeof productReservationSchema>

export type ProductReservationDocumentShape = HydratedDocument<ProductReservationModelFields> & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type ProductReservationDTO = {
  id: string
  productId: string
  inventoryId: string
  productName: string
  product: string
  sku: string
  unit: string
  customerId: string
  customerName: string
  quantity: number
  reservedAt: string
  createdAt: string
  updatedAt: string
}

export const ProductReservationModel: Model<ProductReservationDocumentShape> =
  mongoose.models.ProductReservation ?? mongoose.model<ProductReservationDocumentShape>('ProductReservation', productReservationSchema)
