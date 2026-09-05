import mongoose, { Schema, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose'
import { normalizeTextInput } from '@/lib/text'

const deliveryAddressSchema = new Schema(
  {
    street: { type: String, trim: true, default: '', set: normalizeTextInput },
    number: { type: String, trim: true, default: '', set: normalizeTextInput },
    complement: { type: String, trim: true, default: '', set: normalizeTextInput },
    district: { type: String, trim: true, default: '', set: normalizeTextInput },
    city: { type: String, trim: true, default: '', set: normalizeTextInput },
    state: { type: String, trim: true, default: '', set: normalizeTextInput },
  },
  { _id: false }
)

const deliveryItemSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    productId: { type: String, required: true, trim: true, set: normalizeTextInput },
    productName: { type: String, required: true, trim: true, set: normalizeTextInput },
    sku: { type: String, required: true, trim: true, set: normalizeTextInput },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, set: normalizeTextInput },
    delivered: { type: Boolean, default: false },
    deliveredAt: { type: String, default: undefined },
  },
  { _id: false }
)

const deliverySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    saleId: { type: String, required: true, trim: true, index: true },
    saleNumber: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    customerId: { type: String, required: true, trim: true, index: true },
    customerName: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    customerPhone: { type: String, trim: true, default: '', set: normalizeTextInput },
    address: { type: deliveryAddressSchema, default: () => ({ street: '', number: '', complement: '', district: '', city: '', state: '' }) },
    scheduledDate: { type: String, required: true, trim: true, index: true },
    deliveredAt: { type: String, default: undefined },
    status: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    driverName: { type: String, trim: true, default: '', set: normalizeTextInput },
    notes: { type: String, trim: true, default: '', set: normalizeTextInput },
    items: { type: [deliveryItemSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc: unknown, ret: Record<string, unknown> & { _id?: unknown }) => {
        ret.id = String(ret._id)
        delete ret._id
        return ret
      },
    },
  }
)

deliverySchema.index({ customerName: 1 })
deliverySchema.index({ saleNumber: 1 })
deliverySchema.index({ 'address.city': 1 })
deliverySchema.index({ driverName: 1 })
deliverySchema.index({ userId: 1, saleId: 1 }, { unique: true })

export type DeliveryModelFields = InferSchemaType<typeof deliverySchema>

export type DeliveryDocumentShape = HydratedDocument<DeliveryModelFields> & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const DeliveryModel: Model<DeliveryDocumentShape> =
  mongoose.models.Delivery ?? mongoose.model<DeliveryDocumentShape>('Delivery', deliverySchema)
