import mongoose, { Schema, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose'
import { normalizeTextInput } from '@/lib/text'
import { normalizePurchasePaymentCondition } from '@/lib/purchases'

const purchaseItemSchema = new Schema(
  {
    productId: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true, set: normalizeTextInput },
    brand: { type: String, trim: true, default: '', set: normalizeTextInput },
    product: { type: String, required: true, trim: true, default: '', set: normalizeTextInput },
    category: { type: String, required: true, trim: true, default: 'geral', set: normalizeTextInput },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, set: normalizeTextInput },
    unitPrice: { type: Number, required: true, min: 0 },
    profitPercentage: { type: Number, required: true, min: 0, default: 0 },
    salePrice: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const purchaseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    supplier: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    purchaseDate: { type: String, required: true, trim: true, index: true },
    expectedDelivery: { type: String, trim: true, default: '', set: normalizeTextInput },
    paymentCondition: { type: [String], default: [], set: normalizePurchasePaymentCondition },
    paymentMethod: { type: String, trim: true, default: '', set: normalizeTextInput },
    invoiceNumber: { type: String, trim: true, default: '', index: true, set: normalizeTextInput },
    notes: { type: String, trim: true, default: '', set: normalizeTextInput },
    subtotal: { type: Number, required: true, min: 0 },
    discounts: { type: Number, required: true, min: 0, default: 0 },
    freight: { type: Number, required: true, min: 0, default: 0 },
    otherExpenses: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    items: { type: [purchaseItemSchema], default: [] },
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

purchaseSchema.index({ supplier: 1 })
purchaseSchema.index({ invoiceNumber: 1 })

export type PurchaseModelFields = InferSchemaType<typeof purchaseSchema>

export type PurchaseDocumentShape = HydratedDocument<PurchaseModelFields> & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type PurchaseDTO = {
  id: string
  supplier: string
  purchaseDate: string
  expectedDelivery: string | null
  paymentCondition: string[]
  paymentMethod: string | null
  invoiceNumber: string | null
  notes: string
  subtotal: number
  discounts: number
  freight: number
  otherExpenses: number
  total: number
  items: Array<{
    id: string
    productId: string
    productName: string
    brand: string
    product: string
    category: string
    quantity: number
    unit: string
    unitPrice: number
    profitPercentage: number
    salePrice: number
    discount: number
    subtotal: number
  }>
  createdAt: string
  updatedAt: string
}

const existingPurchaseModel = mongoose.models.Purchase as Model<PurchaseDocumentShape> | undefined
const paymentConditionPath = existingPurchaseModel?.schema.path('paymentCondition')
const isLegacyPurchaseModel = paymentConditionPath?.instance === 'String'

if (isLegacyPurchaseModel) {
  delete mongoose.models.Purchase
}

export const PurchaseModel: Model<PurchaseDocumentShape> =
  mongoose.models.Purchase ?? mongoose.model<PurchaseDocumentShape>('Purchase', purchaseSchema)
