import mongoose, { Schema, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose'
import { normalizeTextInput } from '@/lib/text'

const inventoryMovementSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemId: { type: String, required: true, trim: true, index: true },
    type: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    quantity: { type: Number, required: true, min: 0 },
    date: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true, set: normalizeTextInput },
    user: { type: String, required: true, trim: true, set: normalizeTextInput },
  },
  {
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

const inventorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    brand: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    product: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    sku: { type: String, required: true, trim: true, set: normalizeTextInput },
    category: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    unit: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    costPrice: { type: Number, required: true, min: 0 },
    profitPercentage: { type: Number, required: true, min: 0, default: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    currentStock: { type: Number, required: true, min: 0 },
    minimumStock: { type: Number, required: true, min: 0 },
    reservedStock: { type: Number, required: true, min: 0 },
    availableStock: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    supplier: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    lastEntryDate: { type: String, trim: true, default: '' },
    lastOutputDate: { type: String, trim: true, default: '' },
    notes: { type: String, default: '', trim: true, set: normalizeTextInput },
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

inventorySchema.index({ userId: 1, productName: 1, unit: 1, brand: 1 }, { unique: true })
inventorySchema.index({ userId: 1, sku: 1 }, { unique: true })
inventorySchema.index({ userId: 1, productId: 1 }, { unique: true })

inventoryMovementSchema.index({ itemId: 1, date: -1 })
inventoryMovementSchema.index({ userId: 1, itemId: 1, date: -1 })

export type InventoryModelFields = InferSchemaType<typeof inventorySchema>
export type InventoryMovementModelFields = InferSchemaType<typeof inventoryMovementSchema>

export type InventoryDocumentShape = HydratedDocument<InventoryModelFields> & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type InventoryMovementDocumentShape = HydratedDocument<InventoryMovementModelFields> & {
  _id: mongoose.Types.ObjectId
}

export type InventoryDTO = {
  id: string
  productId: string
  productName: string
  brand: string
  product: string
  sku: string
  category: string
  unit: string
  costPrice: number
  profitPercentage: number
  salePrice: number
  currentStock: number
  minimumStock: number
  reservedStock: number
  availableStock: number
  location: string
  supplier: string
  lastEntryDate: string
  lastOutputDate: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type InventoryMovementDTO = {
  id: string
  itemId: string
  type: string
  quantity: number
  date: string
  description: string
  user: string
}

export const InventoryModel: Model<InventoryDocumentShape> =
  mongoose.models.Inventory ?? mongoose.model<InventoryDocumentShape>('Inventory', inventorySchema)

export const InventoryMovementModel: Model<InventoryMovementDocumentShape> =
  mongoose.models.InventoryMovement ??
  mongoose.model<InventoryMovementDocumentShape>('InventoryMovement', inventoryMovementSchema)
