import mongoose, { Schema, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose'
import { normalizeTextInput } from '@/lib/text'

const saleInstallmentSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    number: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true, trim: true, set: normalizeTextInput },
    dueDate: { type: String, default: '', trim: true },
    status: { type: String, required: true, enum: ['PENDENTE', 'PAGO'], default: 'PENDENTE', trim: true },
  },
  { _id: false }
)

const salePaymentSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: String, required: true, trim: true },
    paymentMethod: { type: String, trim: true, default: '', set: normalizeTextInput },
    notes: { type: String, trim: true, default: '', set: normalizeTextInput },
  },
  { _id: false }
)

const salePaymentConditionSchema = new Schema(
  {
    type: { type: String, required: true, enum: ['A_VISTA', 'PARCELADO', 'FIADO', 'PRAZO'], trim: true },
    installments: { type: [saleInstallmentSchema], default: [] },
  },
  { _id: false }
)

const saleItemSchema = new Schema(
  {
    productId: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true, set: normalizeTextInput },
    brand: { type: String, trim: true, default: '', set: normalizeTextInput },
    product: { type: String, trim: true, default: '', set: normalizeTextInput },
    sku: { type: String, required: true, trim: true, set: normalizeTextInput },
    unit: { type: String, required: true, trim: true, set: normalizeTextInput },
    quantity: { type: Number, required: true, min: 0 },
    availableStock: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const saleHistorySchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    saleId: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true, set: normalizeTextInput },
    description: { type: String, required: true, trim: true, set: normalizeTextInput },
    user: { type: String, required: true, trim: true, set: normalizeTextInput },
    date: { type: String, required: true, trim: true },
  },
  { _id: false }
)

const saleSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerId: { type: String, required: true, trim: true, index: true },
    customerName: { type: String, required: true, trim: true, set: normalizeTextInput },
    sellerId: { type: String, required: true, trim: true, index: true },
    sellerName: { type: String, required: true, trim: true, set: normalizeTextInput },
    saleDate: { type: String, required: true, trim: true, index: true },
    isDelivery: { type: Boolean, required: true, default: false },
    deliveryStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'DELIVERED'],
      default(this: SaleModelFields & { isDelivery?: boolean }) {
        return this.isDelivery ? 'PENDING' : 'DELIVERED'
      },
      index: true,
    },
    deliveryDate: { type: String, default: '' },
    paymentMethod: { type: String, trim: true, default: '', index: true, set: normalizeTextInput },
    paymentCondition: { type: salePaymentConditionSchema, required: true },
    payments: { type: [salePaymentSchema], default: [] },
    paymentStatus: { type: String, required: true, enum: ['PENDING', 'PARTIAL', 'PAID'], default: 'PENDING', index: true },
    paidAmount: { type: Number, required: true, min: 0, default: 0 },
    remainingAmount: { type: Number, required: true, min: 0, default: 0 },
    initialPayment: { type: Number, min: 0, default: 0 },
    notes: { type: String, default: '', trim: true, set: normalizeTextInput },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    otherCosts: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    items: { type: [saleItemSchema], default: [] },
    history: { type: [saleHistorySchema], default: [] },
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

saleSchema.index({ customerName: 1 })
saleSchema.index({ sellerName: 1 })

export type SaleModelFields = InferSchemaType<typeof saleSchema>

export type SaleDocumentShape = HydratedDocument<SaleModelFields> & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const existingSaleModel = mongoose.models.Sale as Model<SaleDocumentShape> | undefined
const paymentConditionPath = existingSaleModel?.schema.path('paymentCondition')
const isLegacySaleModel = paymentConditionPath?.instance === 'String'

if (isLegacySaleModel) {
  delete mongoose.models.Sale
}

export const SaleModel: Model<SaleDocumentShape> =
  mongoose.models.Sale ?? mongoose.model<SaleDocumentShape>('Sale', saleSchema)
