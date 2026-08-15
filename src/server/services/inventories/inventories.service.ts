import mongoose from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { AppError } from '@/server/errors/app-error'
import { requireCurrentUser } from '@/server/auth/current-user'
import { ProductModel } from '@/server/models/products/products.model'
import {
  InventoryModel,
  InventoryMovementModel,
  type InventoryDTO,
  type InventoryDocumentShape,
  type InventoryMovementDTO,
  type InventoryMovementDocumentShape,
} from '@/server/models/inventories/inventories.model'
import {
  inventoryCreateSchema,
  inventoryListQuerySchema,
  inventoryMovementListQuerySchema,
  inventoryUpdateSchema,
  type CreateInventoryInput,
} from '@/server/schemas/inventories/inventories.schema'
import { buildProductLabel } from '@/lib/products'
import { calculateAvailableStock, calculateInventoryProfitPercentage } from '@/lib/inventories/inventory'
import { normalizeTextInput } from '@/lib/text'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeInventoryInput(input: Pick<CreateInventoryInput, 'productName' | 'unit' | 'brand'>) {
  return {
    productName: normalizeTextInput(input.productName),
    unit: normalizeTextInput(input.unit),
    brand: normalizeTextInput(input.brand),
  }
}

function nowISO() {
  return new Date().toISOString()
}

type InventorySyncItem = {
  productId: string
  productName: string
  brand?: string | null
  product?: string | null
  category?: string | null
  sku?: string | null
  unit: string
  quantity: number
  unitPrice: number
  profitPercentage?: number | null
  salePrice?: number | null
}

function normalizeProductText(value: string | null | undefined) {
  return normalizeTextInput(value)
}

function normalizeProductId(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function buildPurchaseInventoryPayload(item: InventorySyncItem, supplier: string, quantity: number, userId: string) {
  const productName = normalizeProductText(item.productName)
  const unit = normalizeProductText(item.unit)
  const brand = normalizeProductText(item.brand)
  const product = normalizeProductText(item.product) || buildProductLabel(productName, unit, brand)
  const category = normalizeProductText(item.category) || 'geral'
  const profitPercentage = item.profitPercentage ?? calculateInventoryProfitPercentage(item.unitPrice, item.salePrice ?? item.unitPrice)

  return {
    userId,
    productId: normalizeProductId(item.productId),
    productName,
    brand,
    product,
    sku: normalizeProductText(item.sku) || `EST-${Date.now().toString().slice(-8)}`,
    category,
    unit,
    costPrice: item.unitPrice,
    profitPercentage,
    salePrice: item.salePrice ?? item.unitPrice,
    currentStock: quantity,
    minimumStock: 0,
    reservedStock: 0,
    availableStock: quantity,
    location: normalizeTextInput('A definir'),
    supplier: normalizeProductText(supplier),
    lastEntryDate: nowISO(),
    lastOutputDate: normalizeTextInput(''),
    notes: normalizeTextInput(''),
  }
}

async function findInventoryByProduct(item: Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand'>, session?: mongoose.ClientSession) {
  const currentUser = await requireCurrentUser()
  const brand = normalizeProductText(item.brand)
  const productId = normalizeProductId(item.productId)
  const filters: Array<Record<string, unknown>> = [
    {
      productName: normalizeProductText(item.productName),
      unit: normalizeProductText(item.unit),
      brand,
    },
  ]

  if (productId) {
    filters.unshift({ productId })
  }

  return InventoryModel.findOne({ userId: currentUser.id, $or: filters }).session(session ?? null)
}

async function saveMovement(
  itemId: string,
  type: 'Entrada' | 'Saída' | 'Ajuste' | 'Transferência',
  quantity: number,
  description: string,
  user: string,
  session?: mongoose.ClientSession
) {
  const currentUser = await requireCurrentUser()
  const movement = new InventoryMovementModel({
    userId: currentUser.id,
    itemId,
    type: normalizeTextInput(type),
    quantity,
    date: nowISO(),
    description: normalizeTextInput(description),
    user: normalizeTextInput(user),
  })

  await movement.save(session ? { session } : undefined)
}

async function applyDelta(
  item: InventoryDocumentShape,
  delta: number,
  mode: 'purchase' | 'sale' | 'purchase-revert' | 'sale-revert',
  session?: mongoose.ClientSession
) {
  const currentStock = toFiniteNumber(item.currentStock, NaN)
  const reservedStock = toFiniteNumber(item.reservedStock, NaN)
  const nextDelta = toFiniteNumber(delta, NaN)

  if (!Number.isFinite(currentStock) || !Number.isFinite(reservedStock) || !Number.isFinite(nextDelta)) {
    throw new AppError('Dados inválidos de estoque para atualizar a movimentação.', 400)
  }

  const nextStock = currentStock + nextDelta
  if (nextStock < 0) {
    throw new AppError('Estoque insuficiente para realizar a movimentação.', 409)
  }

  item.currentStock = nextStock
  item.availableStock = calculateAvailableStock(nextStock, reservedStock)
  item.updatedAt = new Date()

  if (nextDelta > 0) {
    item.lastEntryDate = nowISO()
  } else if (nextDelta < 0) {
    item.lastOutputDate = nowISO()
  }

  const saved = await item.save(session ? { session } : undefined)

  await saveMovement(
    String(saved._id),
    nextDelta > 0 ? 'Entrada' : 'Saída',
    Math.abs(nextDelta),
    mode === 'purchase'
      ? 'Entrada registrada por compra.'
      : mode === 'sale'
        ? 'Baixa registrada por venda.'
        : mode === 'purchase-revert'
          ? 'Reversão de compra registrada.'
          : 'Reversão de venda registrada.',
    mode.includes('sale') ? 'Vendas' : 'Compras',
    session
  )

  return saved
}

async function reconcileByProductId(
  previousItems: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'profitPercentage' | 'salePrice' | 'product' | 'sku'>>,
  nextItems: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'profitPercentage' | 'salePrice' | 'product' | 'sku'>>,
  supplier: string | undefined,
  userId: string,
  session?: mongoose.ClientSession
) {
  const itemKey = (item: Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand'>) =>
    normalizeProductId(item.productId) || `${normalizeProductText(item.productName)}|${normalizeProductText(item.unit)}|${normalizeProductText(item.brand)}`

  const previousByKey = new Map(previousItems.map((item) => [itemKey(item), item]))
  const nextByKey = new Map(nextItems.map((item) => [itemKey(item), item]))
  const keys = new Set([...previousByKey.keys(), ...nextByKey.keys()])

  for (const key of keys) {
    const prev = previousByKey.get(key)
    const next = nextByKey.get(key)

    if (!prev && next) {
      const quantity = next.quantity
      const existing = await InventoryModel.findOne({
        userId,
        $or: [
          { productId: normalizeProductId(next.productId) },
          {
            productName: normalizeProductText(next.productName),
            unit: normalizeProductText(next.unit),
            brand: normalizeProductText(next.brand),
          },
        ],
      }).session(session ?? null)
      if (existing) {
        existing.productName = normalizeProductText(next.productName)
        existing.unit = normalizeProductText(next.unit)
        existing.brand = normalizeProductText(next.brand)
        existing.product = normalizeProductText(next.product) || buildProductLabel(next.productName, next.unit, next.brand ?? '')
        existing.costPrice = next.unitPrice
        existing.profitPercentage = next.profitPercentage ?? existing.profitPercentage
        existing.salePrice = next.salePrice ?? existing.salePrice
        existing.supplier = normalizeProductText(supplier) || existing.supplier
        await applyDelta(existing, quantity, 'purchase', session)
        continue
      }

      const created = new InventoryModel(buildPurchaseInventoryPayload(next, supplier ?? '', quantity, userId))
      const saved = await created.save(session ? { session } : undefined)
      await saveMovement(String(saved._id), 'Entrada', quantity, 'Entrada registrada por compra.', 'Compras', session)
      continue
    }

    if (prev && !next) {
      const existing = await InventoryModel.findOne({
        userId,
        $or: [
          { productId: normalizeProductId(prev.productId) },
          {
            productName: normalizeProductText(prev.productName),
            unit: normalizeProductText(prev.unit),
            brand: normalizeProductText(prev.brand),
          },
        ],
      }).session(session ?? null)
      if (!existing) {
        throw new AppError('Item de estoque não encontrado para reverter a movimentação.', 404)
      }

      await applyDelta(existing, -prev.quantity, 'purchase-revert', session)
      continue
    }

    if (prev && next) {
      const delta = next.quantity - prev.quantity
      const existing = await InventoryModel.findOne({
        userId,
        $or: [
          { productId: normalizeProductId(next.productId) },
          {
            productName: normalizeProductText(next.productName),
            unit: normalizeProductText(next.unit),
            brand: normalizeProductText(next.brand),
          },
        ],
      }).session(session ?? null)
      if (!existing) {
        throw new AppError('Item de estoque não encontrado para atualizar a movimentação.', 404)
      }

      existing.productName = normalizeProductText(next.productName)
      existing.unit = normalizeProductText(next.unit)
      existing.brand = normalizeProductText(next.brand)
      existing.product = normalizeProductText(next.product) || buildProductLabel(next.productName, next.unit, next.brand ?? '')
      existing.costPrice = next.unitPrice
      existing.profitPercentage = next.profitPercentage ?? existing.profitPercentage
      existing.salePrice = next.salePrice ?? existing.salePrice
      existing.supplier = normalizeProductText(supplier) || existing.supplier

      if (delta !== 0) {
        await applyDelta(existing, delta, delta > 0 ? 'purchase' : 'purchase-revert', session)
      } else {
        await existing.save(session ? { session } : undefined)
      }
    }
  }
}

async function reconcileSaleByProductId(
  previousItems: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'salePrice' | 'product' | 'sku'>>,
  nextItems: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'salePrice' | 'product' | 'sku'>>,
  session?: mongoose.ClientSession
) {
  const itemKey = (item: Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand'>) =>
    normalizeProductId(item.productId) || `${normalizeProductText(item.productName)}|${normalizeProductText(item.unit)}|${normalizeProductText(item.brand)}`

  const previousByKey = new Map(previousItems.map((item) => [itemKey(item), item]))
  const nextByKey = new Map(nextItems.map((item) => [itemKey(item), item]))
  const keys = new Set([...previousByKey.keys(), ...nextByKey.keys()])

  for (const key of keys) {
    const prev = previousByKey.get(key)
    const next = nextByKey.get(key)

    if (!prev && next) {
      const existing = await findInventoryByProduct(next, session)
      if (!existing) {
        throw new AppError('Item de estoque não encontrado para registrar a venda.', 404)
      }

      await applyDelta(existing, -next.quantity, 'sale', session)
      continue
    }

    if (prev && !next) {
      const existing = await findInventoryByProduct(prev, session)
      if (!existing) {
        throw new AppError('Item de estoque não encontrado para reverter a venda.', 404)
      }

      await applyDelta(existing, prev.quantity, 'sale-revert', session)
      continue
    }

    if (prev && next) {
      const delta = next.quantity - prev.quantity
      if (delta === 0) continue

      const existing = await findInventoryByProduct(next, session)
      if (!existing) {
        throw new AppError('Item de estoque não encontrado para atualizar a venda.', 404)
      }

      await applyDelta(existing, -delta, delta > 0 ? 'sale' : 'sale-revert', session)
    }
  }
}

function toInventoryDTO(item: InventoryDocumentShape): InventoryDTO {
  const profitPercentage = item.profitPercentage ?? calculateInventoryProfitPercentage(item.costPrice, item.salePrice)

  return {
    id: String(item._id),
    productId: item.productId,
    productName: item.productName,
    brand: item.brand,
    product: item.product,
    sku: item.sku,
    category: item.category,
    unit: item.unit,
    costPrice: item.costPrice,
    profitPercentage,
    salePrice: item.salePrice,
    currentStock: item.currentStock,
    minimumStock: item.minimumStock,
    reservedStock: item.reservedStock,
    availableStock: item.availableStock,
    location: item.location,
    supplier: item.supplier,
    lastEntryDate: item.lastEntryDate,
    lastOutputDate: item.lastOutputDate,
    notes: item.notes ?? '',
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

function toMovementDTO(movement: InventoryMovementDocumentShape): InventoryMovementDTO {
  return {
    id: String(movement._id),
    itemId: movement.itemId,
    type: movement.type,
    quantity: movement.quantity,
    date: movement.date,
    description: movement.description,
    user: movement.user,
  }
}

async function findInventoryByIdOrThrow(id: string, userId: string, session?: mongoose.ClientSession) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('ID do estoque inválido.', 400)
  }

  const item = await InventoryModel.findOne({ _id: id, userId }).session(session ?? null)
  if (!item) {
    throw new AppError('Item de estoque não encontrado.', 404)
  }

  return item
}

async function ensureUniqueInventory(input: CreateInventoryInput, userId: string, excludeId?: string) {
  const normalized = normalizeInventoryInput(input)
  const duplicate = await InventoryModel.findOne({
    userId,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    productName: normalized.productName,
    unit: normalized.unit,
    brand: normalized.brand,
  }).lean<InventoryDocumentShape | null>()

  if (duplicate) {
    throw new AppError('Já existe um item de estoque cadastrado com essa combinação.', 409)
  }

  return normalized
}

async function createMovement(input: {
  itemId: string
  type: string
  quantity: number
  description: string
  user: string
  userId: string
}) {
  const movement = new InventoryMovementModel({
    userId: input.userId,
    itemId: input.itemId,
    type: normalizeTextInput(input.type),
    quantity: input.quantity,
    date: nowISO(),
    description: normalizeTextInput(input.description),
    user: normalizeTextInput(input.user),
  })

  await movement.save()
}

export const InventoryService = {
  async list(search?: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const parsed = inventoryListQuerySchema.parse({ search })

    const filter: Record<string, unknown> = { userId: currentUser.id }
    if (parsed.search) {
      filter.$or = [
        { productName: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { product: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { brand: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { sku: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { category: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { supplier: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { location: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
      ]
    }

    const items = await InventoryModel.find(filter).sort({ updatedAt: -1 }).lean<InventoryDocumentShape[]>()
    return items.map(toInventoryDTO)
  },

  async create(data: unknown) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const parsed = inventoryCreateSchema.parse(data)
    const normalized = await ensureUniqueInventory(parsed, currentUser.id)
    const product = normalizeProductText(parsed.product) || buildProductLabel(parsed.productName, parsed.unit, parsed.brand)
    const productId = parsed.productId?.trim() || new mongoose.Types.ObjectId().toString()
    const sku = normalizeProductText(parsed.sku) || `EST-${Date.now().toString().slice(-8)}`
    const createdAt = nowISO()
    const lastEntryDate = normalizeProductText(parsed.lastEntryDate) || (parsed.currentStock > 0 ? createdAt : '')
    const lastOutputDate = normalizeProductText(parsed.lastOutputDate)
    const availableStock = calculateAvailableStock(parsed.currentStock, parsed.reservedStock)
    const profitPercentage = parsed.profitPercentage ?? calculateInventoryProfitPercentage(parsed.costPrice, parsed.salePrice)

    const created = await InventoryModel.create({
      userId: currentUser.id,
      productId,
      product,
      sku,
      lastEntryDate,
      lastOutputDate,
      availableStock,
      profitPercentage,
      ...normalized,
      notes: normalizeProductText(parsed.notes),
    })

    if (created.currentStock > 0) {
      await createMovement({
        userId: currentUser.id,
        itemId: String(created._id),
        type: 'Entrada',
        quantity: created.currentStock,
        description: `Cadastro inicial do produto ${created.product}.`,
        user: 'Sistema',
      })
    }

    return toInventoryDTO(created)
  },

  async getById(id: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    return toInventoryDTO(await findInventoryByIdOrThrow(id, currentUser.id))
  },

  async update(id: string, data: unknown) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const session = await mongoose.startSession()

    try {
      let updatedItem: InventoryDocumentShape | null = null

      await session.withTransaction(async () => {
        const item = await findInventoryByIdOrThrow(id, currentUser.id, session)
        const parsed = inventoryUpdateSchema.parse(data)

        const nextProductName = parsed.productName ?? item.productName
        const nextUnit = parsed.unit ?? item.unit
        const nextBrand = parsed.brand ?? item.brand
        const nextCategory = parsed.category ?? item.category
        const nextLocation = parsed.location ?? item.location
        const nextSupplier = parsed.supplier ?? item.supplier
        const nextCostPrice = parsed.costPrice ?? item.costPrice
        const nextSalePrice = parsed.salePrice ?? item.salePrice
        const nextProfitPercentage = parsed.profitPercentage ?? calculateInventoryProfitPercentage(nextCostPrice, nextSalePrice)
        const nextCurrentStock = parsed.currentStock ?? item.currentStock
        const nextMinimumStock = parsed.minimumStock ?? item.minimumStock
        const nextReservedStock = parsed.reservedStock ?? item.reservedStock
        const normalized = await ensureUniqueInventory(
          {
            productName: nextProductName,
            unit: nextUnit,
            brand: nextBrand,
            category: nextCategory,
            location: nextLocation,
            supplier: nextSupplier,
            costPrice: nextCostPrice,
            profitPercentage: nextProfitPercentage,
            salePrice: nextSalePrice,
            currentStock: nextCurrentStock,
            minimumStock: nextMinimumStock,
            reservedStock: nextReservedStock,
            productId: item.productId,
            sku: item.sku,
            notes: parsed.notes ?? item.notes,
            lastEntryDate: parsed.lastEntryDate ?? item.lastEntryDate,
            lastOutputDate: parsed.lastOutputDate ?? item.lastOutputDate,
            product: parsed.product ?? item.product,
          },
          currentUser.id,
          id
        )

        const linkedProduct = await ProductModel.findOne({
          userId: currentUser.id,
          $or: [
            ...(mongoose.isValidObjectId(item.productId) ? [{ _id: item.productId }] : []),
            {
              name: item.productName,
              unit: item.unit,
              brand: item.brand,
            },
          ],
        }).session(session)

        if (linkedProduct) {
          const duplicateProduct = await ProductModel.findOne({
            userId: currentUser.id,
            _id: { $ne: linkedProduct._id },
            name: normalized.productName,
            unit: normalized.unit,
            brand: normalized.brand,
          }).session(session)

          if (duplicateProduct) {
            throw new AppError('Já existe um produto cadastrado com essa combinação de nome, unidade e marca.', 409)
          }

          linkedProduct.name = normalized.productName
          linkedProduct.unit = normalized.unit
          linkedProduct.brand = normalized.brand
          linkedProduct.product = buildProductLabel(normalized.productName, normalized.unit, normalized.brand)
          linkedProduct.salePrice = nextSalePrice
        }

        item.productName = normalized.productName
        item.unit = normalized.unit
        item.brand = normalized.brand
        item.product = normalizeProductText(parsed.product) || buildProductLabel(normalized.productName, normalized.unit, normalized.brand)
        if (linkedProduct) {
          item.productId = String(linkedProduct._id)
        }
        item.category = normalizeTextInput(nextCategory)
        item.location = normalizeTextInput(nextLocation)
        item.supplier = normalizeTextInput(nextSupplier)
        item.costPrice = nextCostPrice
        item.profitPercentage = nextProfitPercentage
        item.salePrice = nextSalePrice
        item.currentStock = nextCurrentStock
        item.minimumStock = nextMinimumStock
        item.reservedStock = nextReservedStock
        item.availableStock = calculateAvailableStock(nextCurrentStock, nextReservedStock)
        item.notes = parsed.notes !== undefined ? normalizeTextInput(parsed.notes) : item.notes
        item.lastEntryDate = parsed.lastEntryDate !== undefined ? normalizeTextInput(parsed.lastEntryDate) : item.lastEntryDate
        item.lastOutputDate = parsed.lastOutputDate !== undefined ? normalizeTextInput(parsed.lastOutputDate) : item.lastOutputDate

        updatedItem = await item.save({ session })
        if (linkedProduct) {
          await linkedProduct.save({ session })
        }
      })

      if (!updatedItem) {
        throw new AppError('Não foi possível atualizar o item de estoque.', 500)
      }

      return toInventoryDTO(updatedItem)
    } finally {
      session.endSession()
    }
  },

  async remove(id: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const item = await findInventoryByIdOrThrow(id, currentUser.id)
    await InventoryMovementModel.deleteMany({ itemId: id, userId: currentUser.id })
    await item.deleteOne()
    return { id: String(item._id), deleted: true }
  },

  async getMovements(itemId: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    if (!mongoose.isValidObjectId(itemId)) {
      throw new AppError('ID do estoque inválido.', 400)
    }

    const movements = await InventoryMovementModel.find({ itemId, userId: currentUser.id }).sort({ date: -1 }).lean<InventoryMovementDocumentShape[]>()
    return movements.map(toMovementDTO)
  },

  async getRecentMovements(limit = 5) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const parsed = inventoryMovementListQuerySchema.parse({ limit })
    const movements = await InventoryMovementModel.find({ userId: currentUser.id }).sort({ date: -1 }).limit(parsed.limit ?? 5).lean<InventoryMovementDocumentShape[]>()
    return movements.map(toMovementDTO)
  },

  async reserveStock(productId: string, quantity: number) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const item = await InventoryModel.findOne({
      userId: currentUser.id,
      $or: [{ productId }, { _id: productId }, { sku: productId }],
    })

    if (!item) return null

    const nextReserved = item.reservedStock + quantity
    if (nextReserved > item.currentStock) return null

    item.reservedStock = nextReserved
    item.availableStock = calculateAvailableStock(item.currentStock, nextReserved)
    return toInventoryDTO(await item.save())
  },

  async releaseReservedStock(productId: string, quantity: number) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const item = await InventoryModel.findOne({
      userId: currentUser.id,
      $or: [{ productId }, { _id: productId }, { sku: productId }],
    })

    if (!item) return null

    item.reservedStock = Math.max(0, item.reservedStock - quantity)
    item.availableStock = calculateAvailableStock(item.currentStock, item.reservedStock)
    return toInventoryDTO(await item.save())
  },

  async getByProductId(productId: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const item = await InventoryModel.findOne({
      userId: currentUser.id,
      $or: [{ productId }, { _id: productId }, { sku: productId }],
    })

    return item ? toInventoryDTO(item) : null
  },

  async applyPurchaseItems(
    items: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'profitPercentage' | 'salePrice' | 'product' | 'sku' | 'category'>>,
    supplier: string,
    userId: string,
    session?: mongoose.ClientSession
  ) {
    await connectToDatabase()
    for (const item of items) {
      const existing = await findInventoryByProduct(item, session)
      if (existing) {
        existing.productName = normalizeProductText(item.productName)
        existing.unit = normalizeProductText(item.unit)
        existing.brand = normalizeProductText(item.brand)
        existing.product = normalizeProductText(item.product) || buildProductLabel(item.productName, item.unit, item.brand ?? '')
        existing.category = normalizeProductText(item.category) || existing.category
        existing.costPrice = item.unitPrice
        existing.salePrice = item.salePrice ?? existing.salePrice
        existing.supplier = normalizeProductText(supplier)
        await applyDelta(existing, item.quantity, 'purchase', session)
        continue
      }

      const created = new InventoryModel(buildPurchaseInventoryPayload(item, supplier, item.quantity, userId))
      const saved = await created.save(session ? { session } : undefined)
      await saveMovement(String(saved._id), 'Entrada', item.quantity, 'Entrada registrada por compra.', 'Compras', session)
    }
  },

  async revertPurchaseItems(
    items: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'category'>>,
    userId: string,
    session?: mongoose.ClientSession
  ) {
    await connectToDatabase()
    for (const item of items) {
      const existing = await findInventoryByProduct(item, session)
      if (!existing) {
        throw new AppError('Item de estoque não encontrado para reverter a compra.', 404)
      }

      await applyDelta(existing, -item.quantity, 'purchase-revert', session)
    }
  },

  async reconcilePurchaseItems(
    previousItems: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'profitPercentage' | 'salePrice' | 'product' | 'sku' | 'category'>>,
    nextItems: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'profitPercentage' | 'salePrice' | 'product' | 'sku' | 'category'>>,
    supplier: string,
    userId: string,
    session?: mongoose.ClientSession
  ) {
    return reconcileByProductId(previousItems, nextItems, supplier, userId, session)
  },

  async applySaleItems(
    items: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'salePrice' | 'product' | 'sku'>>,
    userId: string,
    session?: mongoose.ClientSession
  ) {
    await connectToDatabase()
    for (const item of items) {
      const existing = await findInventoryByProduct(item, session)
      if (!existing) {
        throw new AppError('Item de estoque não encontrado para registrar a venda.', 404)
      }

      await applyDelta(existing, -item.quantity, 'sale', session)
    }
  },

  async revertSaleItems(
    items: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'salePrice' | 'product' | 'sku'>>,
    userId: string,
    session?: mongoose.ClientSession
  ) {
    await connectToDatabase()
    for (const item of items) {
      const existing = await findInventoryByProduct(item, session)
      if (!existing) {
        throw new AppError('Item de estoque não encontrado para reverter a venda.', 404)
      }

      await applyDelta(existing, item.quantity, 'sale-revert', session)
    }
  },

  async reconcileSaleItems(
    previousItems: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'profitPercentage' | 'salePrice' | 'product' | 'sku'>>,
    nextItems: Array<Pick<InventorySyncItem, 'productId' | 'productName' | 'unit' | 'brand' | 'quantity' | 'unitPrice' | 'profitPercentage' | 'salePrice' | 'product' | 'sku'>>,
    userId: string,
    session?: mongoose.ClientSession
  ) {
    return reconcileSaleByProductId(previousItems, nextItems, session)
  },
}
