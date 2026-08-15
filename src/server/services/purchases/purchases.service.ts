import mongoose from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { requireCurrentUser } from '@/server/auth/current-user'
import { AppError } from '@/server/errors/app-error'
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

async function migrateLegacyPurchasePaymentConditions(userId: string) {
  const legacyPurchases = await PurchaseModel.find({
    userId,
    $or: [
      { paymentCondition: { $type: 'string' } },
      { paymentCondition: { $type: 'object' } },
      { paymentCondition: { $exists: false } },
      { paymentCondition: null },
    ],
  })
    .select({ paymentCondition: 1 })
    .lean<Array<{ _id: mongoose.Types.ObjectId; paymentCondition?: string | string[] | { n1?: string; n2?: string; n3?: string } | null }>>()

  if (legacyPurchases.length === 0) {
    return
  }

  await Promise.all(
    legacyPurchases.map((purchase) =>
      PurchaseModel.updateOne(
        { _id: purchase._id },
        {
          $set: {
            paymentCondition: normalizePurchasePaymentCondition(purchase.paymentCondition),
          },
        }
      )
    )
  )
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

async function findOrCreateCatalogProduct(
  input: { name: string; unit: string; brand: string; salePrice?: number },
  userId: string,
  session?: mongoose.ClientSession
) {
  const normalized = normalizeProductInput(input)
  const existing = await ProductModel.findOne({
    userId,
    name: normalized.name,
    unit: normalized.unit,
    brand: normalized.brand,
  }).session(session ?? null)

  if (existing) {
    if (Number.isFinite(input.salePrice) && input.salePrice !== undefined && input.salePrice >= 0 && existing.salePrice !== input.salePrice) {
      existing.salePrice = input.salePrice
      return await existing.save(session ? { session } : undefined)
    }

    return existing
  }

  const created = new ProductModel({
    userId,
    ...normalized,
    product: buildProductLabel(normalized.name, normalized.unit, normalized.brand),
    salePrice: Number.isFinite(input.salePrice) && input.salePrice !== undefined ? input.salePrice : 0,
  })

  try {
    return await created.save(session ? { session } : undefined)
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as { code?: number }).code === 11000) {
      const recovered = await ProductModel.findOne({
        userId,
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

async function normalizeItems(items: UpdatePurchaseInput['items'] | undefined, userId: string, session?: mongoose.ClientSession) {
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
      ? await ProductModel.findOne({ _id: item.productId, userId }).session(session ?? null)
      : await findOrCreateCatalogProduct({ name: productName, unit, brand, salePrice }, userId, session)

    const resolvedProduct = catalogProduct ?? (await findOrCreateCatalogProduct({ name: productName, unit, brand, salePrice }, userId, session))
    const discount = item.discount ?? 0
    const profitPercentage =
      item.profitPercentage ?? calculatePurchaseProfitPercentage(item.unitPrice, salePrice)
    const subtotal = roundCurrency(item.quantity * item.unitPrice - discount)
    output.push({
      productId: String(resolvedProduct._id),
      productName,
      brand: resolvedProduct.brand,
      product: resolvedProduct.product || buildProductLabel(productName, unit, brand),
      category,
      quantity: item.quantity,
      unit: resolvedProduct.unit,
      unitPrice: item.unitPrice,
      profitPercentage,
      salePrice,
      discount,
      subtotal,
    })
  }

  return output
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

async function findPurchaseOrThrow(id: string, userId: string, session?: mongoose.ClientSession) {
  const parsed = purchaseIdParamSchema.parse({ id })

  if (!mongoose.isValidObjectId(parsed.id)) {
    throw new AppError('ID da compra inválido.', 400)
  }

  const purchase = await PurchaseModel.findOne({ _id: parsed.id, userId }).session(session ?? null)
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
    const currentUser = await requireCurrentUser()
    await migrateLegacyPurchasePaymentConditions(currentUser.id)

    const parsed = purchaseListQuerySchema.parse({ search })
    const filter: Record<string, unknown> = { userId: currentUser.id }
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
    const currentUser = await requireCurrentUser()
    await migrateLegacyPurchasePaymentConditions(currentUser.id)
    return toPurchaseDTO(await findPurchaseOrThrow(id, currentUser.id))
  },

  async create(data: unknown) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    await migrateLegacyPurchasePaymentConditions(currentUser.id)
    const session = await mongoose.startSession()
    try {
      let createdDTO: PurchaseDTO | undefined
      await session.withTransaction(async () => {
        const parsed = purchaseCreateSchema.parse(data)
        const items = await normalizeItems(parsed.items, currentUser.id, session)
        const { subtotal, total } = calculateTotals(items, parsed.discounts ?? 0, parsed.freight ?? 0, parsed.otherExpenses ?? 0)

        const created = new PurchaseModel({
          userId: currentUser.id,
          supplier: normalizeTextInput(parsed.supplier),
          purchaseDate: parsed.purchaseDate,
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
        await InventoryService.applyPurchaseItems(toInventorySyncItems(items), normalizeTextInput(parsed.supplier), currentUser.id, session)
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
    const currentUser = await requireCurrentUser()
    await migrateLegacyPurchasePaymentConditions(currentUser.id)
    const session = await mongoose.startSession()
    try {
      let updatedDTO: PurchaseDTO | undefined
      await session.withTransaction(async () => {
        const parsed = purchaseUpdateSchema.parse(data)
        const purchase = await findPurchaseOrThrow(id, currentUser.id, session)
        const previousItems = await normalizeItems(purchase.items as unknown as UpdatePurchaseInput['items'], currentUser.id, session)

        if (parsed.supplier !== undefined) purchase.supplier = normalizeTextInput(parsed.supplier)
        if (parsed.purchaseDate !== undefined) purchase.purchaseDate = parsed.purchaseDate
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

        const nextItems = parsed.items !== undefined ? await normalizeItems(parsed.items, currentUser.id, session) : previousItems
        if (parsed.items !== undefined) purchase.set('items', nextItems)

        const { subtotal, total } = calculateTotals(nextItems, purchase.discounts, purchase.freight, purchase.otherExpenses)
        purchase.subtotal = subtotal
        purchase.total = total

        await purchase.save({ session })
        await InventoryService.reconcilePurchaseItems(
          toInventorySyncItems(previousItems),
          toInventorySyncItems(nextItems),
          purchase.supplier,
          currentUser.id,
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
    const currentUser = await requireCurrentUser()
    await migrateLegacyPurchasePaymentConditions(currentUser.id)
    const session = await mongoose.startSession()
    try {
      let result: { id: string; deleted: true } | undefined
      await session.withTransaction(async () => {
        const purchase = await findPurchaseOrThrow(id, currentUser.id, session)
        const previousItems = await normalizeItems(purchase.items as unknown as UpdatePurchaseInput['items'], currentUser.id, session)
        await InventoryService.revertPurchaseItems(toInventorySyncItems(previousItems), currentUser.id, session)
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
