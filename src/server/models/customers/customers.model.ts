import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import { normalizeTextInput } from '@/lib/text'

function normalizeOptionalDigits(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.replace(/\D/g, '')
  return normalized.length > 0 ? normalized : null
}

const customerAddressSchema = new Schema(
  {
    zipCode: { type: String, trim: true, default: '' },
    street: { type: String, trim: true, default: '', set: normalizeTextInput },
    number: { type: String, trim: true, default: '', set: normalizeTextInput },
    complement: { type: String, trim: true, default: '', set: normalizeTextInput },
    district: { type: String, trim: true, default: '', set: normalizeTextInput },
  },
  { _id: false }
)

const customerSchema = new Schema(
  {
    storeId: { type: String, required: true, trim: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true, set: normalizeTextInput },
    document: { type: String, trim: true, default: null, set: normalizeOptionalDigits },
    phone: { type: String, trim: true, default: null, set: normalizeOptionalDigits },
    addresses: { type: [customerAddressSchema], default: [] },
    notes: { type: String, trim: true, default: '', set: normalizeTextInput },
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

customerSchema.index({ storeId: 1 }, { name: 'customer_store_lookup' })
customerSchema.index(
  { storeId: 1, document: 1 },
  {
    unique: true,
    name: 'customer_user_document_unique',
    partialFilterExpression: {
      document: { $type: 'string' },
    },
  }
)

export type CustomerModelFields = InferSchemaType<typeof customerSchema>

export type CustomerDocumentShape = CustomerModelFields & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type CustomerDTO = {
  id: string
  name: string
  document: string
  phone: string
  addresses: Array<{
    zipCode: string
    street: string
    number: string
    complement: string
    district: string
  }>
  notes: string
  createdAt: string
  updatedAt: string
}

export const CustomerModel: Model<CustomerDocumentShape> =
  mongoose.models.Customer ?? mongoose.model<CustomerDocumentShape>('Customer', customerSchema)
