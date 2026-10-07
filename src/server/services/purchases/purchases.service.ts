import mongoose from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { requireStoreContext, type StoreContext } from '@/server/auth/store-context'
import { AppError } from '@/server/errors/app-error'
import { InventoryModel } from '@/server/models/inventories/inventories.model'
import { ProductModel } from '@/server/models/products/products.model'
import { PurchaseModel, type PurchaseDTO, type PurchaseDocumentShape } from '@/server/models/purchases/purchases.model'
import { InventoryService } from '@/server/services/inventories/inventories.service'
import {
  purchaseCreateSchema,
  purchaseIdParamSchema,
  purchaseListQuerySchema,
  purchaseUpdateSchema,
  type UpdatePurchaseInput,
} from '@/server/schemas/purchases/purchases.schema'
import { calculateSaleTotal, roundCurrency } from '@/lib/sales'
import { buildProductLabel, normalizeProductInput } from '@/lib/products'
import { calculatePurchaseProfitPercentage, calculatePurchaseSalePrice, normalizePurchasePaymentCondition } from '@/lib/purchases'
import { normalizeTextInput } from '@/lib/text'
import { getTodayBusinessDate } from '@/lib/business-date'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeOptionalText(value: string | null | undefined) {
  return normalizeTextInput(value)
}

function normalizeOptionalNullableText(value: string | null | undefined) {
  const normalized = normalizeOptionalText(value)
  return normalized || null
}

function normalizeCategory(value: string | null | undefined) {
  const normalized = normalizeOptionalText(value).toLowerCase()
  return ['geral', 'hidraulico', 'eletrico', 'acabamento'].includes(normalized) ? normalized : 'geral'
}

type NormalizedPurchaseItem = {
  productId: string
  productName: string
  brand: string
  product: string
  category: string
  quantity: number
  unit: string
  unitPrice: number
  salePrice: number
  profitPercentage: number
  discount: number
  subtotal: number
}

export async function findOrCreateCatalogProduct(
  input: { name: string; unit: string; brand?: string; salePrice?: number },
  context: StoreContext,
  session?: mongoose.ClientSession
) {
  const normalized = normalizeProductInput(input)
  const existing = await ProductModel.findOne({
    storeId: context.storeId,
    name: normalized.name,
    unit: normalized.unit,
    brand: normalized.brand,
  }).session(session ?? null)

  if (existing) {
    if (Number.isFinite(input.salePrice) && input.salePrice !== undefined && input.salePrice >= 0 && existing.salePrice !== input.salePrice) {
      existing.salePrice = input.salePrice
      existing.updatedBy = new mongoose.Types.ObjectId(context.actorId)
      return await existing.save(session ? { session } : undefined)
    }

    return existing
  }

  const created = new ProductModel({
    storeId: context.storeId,
    userId: context.actorId,
    createdBy: context.actorId,
    updatedBy: context.actorId,
    ...normalized,
    product: buildProductLabel(normalized.name, normalized.unit, normalized.brand),
    salePrice: Number.isFinite(input.salePrice) && input.salePrice !== undefined ? input.salePrice : 0,
  })

  try {
    return await created.save(session ? { session } : undefined)
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as { code?: number }).code === 11000) {
      const recovered = await ProductModel.findOne({
        storeId: context.storeId,
        name: normalized.name,
        unit: normalized.unit,
        brand: normalized.brand,
      }).session(session ?? null)

      if (recovered) {
        return recovered
      }
    }

    throw error
  }
}

async function normalizeItems(items: UpdatePurchaseInput['items'] | undefined, context: StoreContext, session?: mongoose.ClientSession) {
  const output: NormalizedPurchaseItem[] = []

  for (const item of items ?? []) {
    const brand = normalizeTextInput(item.brand)
    const productName = normalizeTextInput(item.productName)
    const unit = normalizeTextInput(item.unit)
    const category = normalizeCategory((item as { category?: string | null }).category ?? 'geral')
    const salePrice =
      item.salePrice && item.salePrice > 0
        ? item.salePrice
        : calculatePurchaseSalePrice(item.unitPrice, item.profitPercentage ?? 0)
    const catalogProduct = item.productId
      ? await ProductModel.findOne({ _id: item.productId, storeId: context.storeId }).session(session ?? null)
      : await findOrCreateCatalogProduct({ name: productName, unit, brand, salePrice }, context, session)
    const inventoryProduct = item.productId && !catalogProduct
      ? await InventoryModel.findOne({
          storeId: context.storeId,
          $or: [{ productId: item.productId }, ...(mongoose.isValidObjectId(item.productId) ? [{ _id: item.productId }] : [])],
        }).session(session ?? null)
      : null
    if (item.productId && !catalogProduct && !inventoryProduct) {
      throw new AppError('Produto não encontrado.', 404)
    }

    const resolvedProductId = catalogProduct ? String(catalogProduct._id) : inventoryProduct!.productId
    const resolvedProductName = catalogProduct?.name ?? inventoryProduct!.productName
    const resolvedBrand = catalogProduct?.brand ?? inventoryProduct!.brand ?? ''
    const resolvedUnit = catalogProduct?.unit ?? inventoryProduct!.unit
    const resolvedLabel = catalogProduct?.product ?? inventoryProduct!.product
    const discount = item.discount ?? 0
    const profitPercentage =
      item.profitPercentage ?? calculatePurchaseProfitPercentage(item.unitPrice, salePrice)
    const subtotal = roundCurrency(item.quantity * item.unitPrice - discount)
    output.push({
      productId: resolvedProductId,
      productName: resolvedProductName,
      brand: resolvedBrand,
      product: resolvedLabel || buildProductLabel(resolvedProductName, resolvedUnit, resolvedBrand),
      category,
      quantity: item.quantity,
      unit: resolvedUnit,
      unitPrice: item.unitPrice,
      profitPercentage,
      salePrice,
      discount,
      subtotal,
    })
  }

  const grouped = new Map<string, NormalizedPurchaseItem>()
  for (const item of output) {
    const existing = grouped.get(item.productId)
    if (!existing) {
      grouped.set(item.productId, item)
      continue
    }
    if (existing.unitPrice !== item.unitPrice || existing.unit !== item.unit) {
      throw new AppError('Itens repetidos do mesmo produto precisam usar o mesmo preço e unidade.', 400)
    }
    existing.quantity += item.quantity
    existing.discount = roundCurrency(existing.discount + item.discount)
    existing.subtotal = roundCurrency(existing.quantity * existing.unitPrice - existing.discount)
  }

  return [...grouped.values()]
}

function normalizeStoredItems(items: PurchaseDocumentShape['items']): NormalizedPurchaseItem[] {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    brand: item.brand ?? '',
    product: item.product ?? buildProductLabel(item.productName, item.unit, item.brand ?? ''),
    category: item.category ?? 'geral',
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    profitPercentage: item.profitPercentage,
    salePrice: item.salePrice,
    discount: item.discount ?? 0,
    subtotal: item.subtotal,
  }))
}

function calculateTotals(items: NormalizedPurchaseItem[], discounts = 0, freight = 0, otherExpenses = 0) {
  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.subtotal, 0))
  const total = calculateSaleTotal(subtotal, roundCurrency(discounts), roundCurrency(freight), roundCurrency(otherExpenses))

  return { subtotal, total }
}

function toPurchaseDTO(purchase: PurchaseDocumentShape): PurchaseDTO {
  return {
    id: String(purchase._id),
    supplier: purchase.supplier,
    purchaseDate: purchase.purchaseDate,
    expectedDelivery: purchase.expectedDelivery?.trim() ? purchase.expectedDelivery : null,
    paymentCondition: normalizePurchasePaymentCondition(purchase.paymentCondition),
    paymentMethod: purchase.paymentMethod?.trim() ? purchase.paymentMethod : null,
    invoiceNumber: purchase.invoiceNumber?.trim() ? purchase.invoiceNumber : null,
    notes: purchase.notes ?? '',
    subtotal: purchase.subtotal,
    discounts: purchase.discounts,
    freight: purchase.freight,
    otherExpenses: purchase.otherExpenses,
    total: purchase.total,
    items: purchase.items.map((item) => ({
      id: `${String(purchase._id)}-${item.productId}`,
      productId: item.productId,
      productName: item.productName,
      brand: item.brand ?? '',
      product: item.product ?? buildProductLabel(item.productName, item.unit, item.brand ?? ''),
      category: item.category ?? 'geral',
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      profitPercentage: item.profitPercentage,
      salePrice: item.salePrice,
      discount: item.discount ?? 0,
      subtotal: item.subtotal,
    })),
    createdAt: purchase.createdAt.toISOString(),
    updatedAt: purchase.updatedAt.toISOString(),
  }
}

async function findPurchaseOrThrow(id: string, storeId: string, session?: mongoose.ClientSession) {
  const parsed = purchaseIdParamSchema.parse({ id })

  if (!mongoose.isValidObjectId(parsed.id)) {
    throw new AppError('ID da compra inválido.', 400)
  }

  const purchase = await PurchaseModel.findOne({ _id: parsed.id, storeId }).session(session ?? null)
  if (!purchase) {
    throw new AppError('Compra não encontrada.', 404)
  }

  return purchase
}

function toInventorySyncItems(items: NormalizedPurchaseItem[]) {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    brand: item.brand,
    product: item.product,
    category: item.category,
    sku: undefined as string | undefined,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    profitPercentage: item.profitPercentage,
    salePrice: item.salePrice,
  }))
}

export const PurchaseService = {
  async list(search?: string) {
    await connectToDatabase()
    const context = await requireStoreContext()

    const parsed = purchaseListQuerySchema.parse({ search })
    const filter: Record<string, unknown> = { storeId: context.storeId }
    if (parsed.search) {
      filter.$or = [
        { supplier: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { invoiceNumber: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
      ]
    }

    const purchases = await PurchaseModel.find(filter).sort({ createdAt: -1 }).lean<PurchaseDocumentShape[]>()
    return purchases.map(toPurchaseDTO)
  },

  async getById(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    return toPurchaseDTO(await findPurchaseOrThrow(id, context.storeId))
  },

  async create(data: unknown) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const session = await mongoose.startSession()
    try {
      let createdDTO: PurchaseDTO | undefined
      await session.withTransaction(async () => {
        const parsed = purchaseCreateSchema.parse(data)
        const items = await normalizeItems(parsed.items, context, session)
        const { subtotal, total } = calculateTotals(items, parsed.discounts ?? 0, parsed.freight ?? 0, parsed.otherExpenses ?? 0)

        const created = new PurchaseModel({
          storeId: context.storeId,
          userId: context.actorId,
          createdBy: context.actorId,
          updatedBy: context.actorId,
          supplier: normalizeTextInput(parsed.supplier),
          purchaseDate: getTodayBusinessDate(),
          expectedDelivery: normalizeOptionalText(parsed.expectedDelivery),
          paymentCondition: normalizePurchasePaymentCondition(parsed.paymentCondition),
          paymentMethod: normalizeOptionalText(parsed.paymentMethod),
          invoiceNumber: normalizeOptionalNullableText(parsed.invoiceNumber) ?? '',
          notes: normalizeOptionalText(parsed.notes),
          discounts: roundCurrency(parsed.discounts ?? 0),
          freight: roundCurrency(parsed.freight ?? 0),
          otherExpenses: roundCurrency(parsed.otherExpenses ?? 0),
          subtotal,
          total,
          items,
        })

        await created.save({ session })
        await InventoryService.applyPurchaseItems(toInventorySyncItems(items), normalizeTextInput(parsed.supplier), context, session)
        createdDTO = toPurchaseDTO(created)
      })

      if (!createdDTO) {
        throw new AppError('Não foi possível concluir a criação da compra.', 500)
      }

      return createdDTO
    } finally {
      session.endSession()
    }
  },

  async update(id: string, data: unknown) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const session = await mongoose.startSession()
    try {
      let updatedDTO: PurchaseDTO | undefined
      await session.withTransaction(async () => {
        const parsed = purchaseUpdateSchema.parse(data)
        const purchase = await findPurchaseOrThrow(id, context.storeId, session)
        const previousItems = normalizeStoredItems(purchase.items)

        if (parsed.supplier !== undefined) purchase.supplier = normalizeTextInput(parsed.supplier)
        if (parsed.expectedDelivery !== undefined) purchase.expectedDelivery = normalizeOptionalText(parsed.expectedDelivery)
        if (parsed.paymentCondition !== undefined) {
          purchase.paymentCondition = normalizePurchasePaymentCondition(parsed.paymentCondition)
        }
        if (parsed.paymentMethod !== undefined) purchase.paymentMethod = normalizeOptionalText(parsed.paymentMethod)
        if (parsed.invoiceNumber !== undefined) purchase.invoiceNumber = normalizeOptionalText(parsed.invoiceNumber)
        if (parsed.notes !== undefined) purchase.notes = normalizeOptionalText(parsed.notes)
        if (parsed.discounts !== undefined) purchase.discounts = roundCurrency(parsed.discounts)
        if (parsed.freight !== undefined) purchase.freight = roundCurrency(parsed.freight)
        if (parsed.otherExpenses !== undefined) purchase.otherExpenses = roundCurrency(parsed.otherExpenses)

        const nextItems = parsed.items !== undefined ? await normalizeItems(parsed.items, context, session) : previousItems
        if (parsed.items !== undefined) purchase.set('items', nextItems)

        const { subtotal, total } = calculateTotals(nextItems, purchase.discounts, purchase.freight, purchase.otherExpenses)
        purchase.subtotal = subtotal
        purchase.total = total
        purchase.updatedBy = new mongoose.Types.ObjectId(context.actorId)

        await purchase.save({ session })
        await InventoryService.reconcilePurchaseItems(
          toInventorySyncItems(previousItems),
          toInventorySyncItems(nextItems),
          purchase.supplier,
          context,
          session
        )
        updatedDTO = toPurchaseDTO(purchase)
      })

      if (!updatedDTO) {
        throw new AppError('Não foi possível concluir a atualização da compra.', 500)
      }

      return updatedDTO
    } finally {
      session.endSession()
    }
  },

  async remove(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const session = await mongoose.startSession()
    try {
      let result: { id: string; deleted: true } | undefined
      await session.withTransaction(async () => {
        const purchase = await findPurchaseOrThrow(id, context.storeId, session)
        const previousItems = normalizeStoredItems(purchase.items)
        await InventoryService.revertPurchaseItems(toInventorySyncItems(previousItems), context, session)
        await purchase.deleteOne({ session })
        result = { id: String(purchase._id), deleted: true }
      })

      if (!result) {
        throw new AppError('Não foi possível concluir a exclusão da compra.', 500)
      }

      return result
    } finally {
      session.endSession()
    }
  },
}
