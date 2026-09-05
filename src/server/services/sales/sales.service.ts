import mongoose from 'mongoose'
import { z } from 'zod'

import { connectToDatabase } from '@/server/db/mongodb'
import { requireCurrentUser } from '@/server/auth/current-user'
import { AppError } from '@/server/errors/app-error'
import { SaleModel, type SaleDocumentShape } from '@/server/models/sales/sales.model'
import { saleCreateSchema, saleIdParamSchema, saleListQuerySchema, saleUpdateSchema, type UpdateSaleInput } from '@/server/schemas/sales/sales.schema'
import {
  buildSaleInstallmentId,
  calculateSaleTotal,
  getSaleDeliveryStatus,
  isImmediateSalePaymentCondition,
  getSalePaidAmount,
  getSalePaymentStatus,
  getSaleRemainingAmount,
  normalizeSaleDeliveryFlag,
  normalizeSaleDeliveryStatus,
  normalizeSaleInstallment,
  normalizeSalePaymentCondition,
  normalizeSalePaymentConditionType,
  normalizeSalePayments,
  roundCurrency,
} from '@/lib/sales'
import { buildProductLabel } from '@/lib/products'
import { InventoryService } from '@/server/services/inventories/inventories.service'
import { normalizeTextInput } from '@/lib/text'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function nowISO() {
  return new Date().toISOString()
}

function normalizeText(value: string | null | undefined) {
  return normalizeTextInput(value)
}

function normalizeDecimalValue(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.')
    if (!normalized) return value

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : value
  }

  return value
}

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePaymentMethod(paymentConditionType: string, paymentMethod: string | undefined) {
  return isImmediateSalePaymentCondition(paymentConditionType) ? normalizeTextInput(paymentMethod) : ''
}

function prepareSalePaymentCondition(paymentCondition: unknown) {
  const normalized = normalizeSalePaymentCondition(paymentCondition as never)
  return {
    type: normalized.type,
    installments: Array.isArray(normalized.installments) ? normalized.installments.map((installment, index) => {
      const draft = normalizeSaleInstallment(installment)
      return {
        ...draft,
        id: draft.id?.trim() || buildSaleInstallmentId(`legacy-${Date.now()}`, draft.number || index + 1),
        status: draft.status ?? 'PENDENTE',
      }
    }) : [],
  }
}

function buildSalePayments(
  parsed: {
    paymentCondition?: { type?: string; installments?: Array<{ amount?: number; paymentMethod?: string; status?: string; dueDate?: string; id?: string }> }
    paymentMethod?: string
    initialPayment?: number
    payments?: Array<{ id?: string; amount?: number; date?: string; paymentMethod?: string; notes?: string }>
    saleDate?: string
    total?: number
  },
  total: number,
  saleId?: string
) {
  const paymentConditionType = normalizeSalePaymentConditionType(parsed.paymentCondition?.type)
  const existingPayments = normalizeSalePayments(parsed.payments, {
    paymentCondition: parsed.paymentCondition?.type ? ({ type: parsed.paymentCondition.type } as never) : undefined,
    paymentMethod: parsed.paymentMethod,
    initialPayment: parsed.initialPayment,
    saleDate: parsed.saleDate,
    total,
  })

  if (existingPayments.length > 0) {
    return existingPayments.map((payment, index) => ({
      ...payment,
      id: payment.id?.trim() || `${saleId ?? `sale-${Date.now()}`}-payment-${index + 1}`,
      amount: roundCurrency(payment.amount),
      date: payment.date || parsed.saleDate || nowISO(),
      paymentMethod: normalizeTextInput(payment.paymentMethod),
      notes: normalizeTextInput(payment.notes),
    }))
  }

  const legacyInstallments = Array.isArray(parsed.paymentCondition?.installments) ? parsed.paymentCondition.installments : []
  if (legacyInstallments.length > 0) {
    return legacyInstallments
      .filter((installment) => normalizeTextInput(installment.status) === 'PAGO')
      .map((installment, index) => ({
        id: `${saleId ?? `sale-${Date.now()}`}-payment-${index + 1}`,
        amount: roundCurrency(Number(installment.amount ?? 0)),
        date: installment.dueDate?.trim() || parsed.saleDate || nowISO(),
        paymentMethod: normalizeTextInput(installment.paymentMethod),
        notes: '',
      }))
  }

  if (paymentConditionType === 'A_VISTA') {
    return [
      {
        id: `${saleId ?? `sale-${Date.now()}`}-payment-1`,
        amount: roundCurrency(total),
        date: parsed.saleDate || nowISO(),
        paymentMethod: normalizeTextInput(parsed.paymentMethod),
        notes: '',
      },
    ]
  }

  const initialPayment = roundCurrency(Number(parsed.initialPayment ?? 0))
  if (initialPayment <= 0) {
    return []
  }

  return [
    {
      id: `${saleId ?? `sale-${Date.now()}`}-payment-1`,
      amount: initialPayment,
      date: parsed.saleDate || nowISO(),
      paymentMethod: normalizeTextInput(parsed.paymentMethod),
      notes: '',
    },
  ]
}

function validateSalePayments(paymentConditionType: string, payments: Array<{ amount: number }>, total: number, initialPayment?: number) {
  const amountPaid = roundCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))
  const normalizedInitialPayment = roundCurrency(Number(initialPayment ?? 0))

  if (paymentConditionType === 'A_VISTA') {
    if (payments.length !== 1 || roundCurrency(amountPaid - total) !== 0) {
      throw new AppError('Venda à vista precisa registrar o valor total como pago.', 400)
    }
    return
  }

  if (Number.isFinite(initialPayment ?? NaN) && normalizedInitialPayment > total) {
    throw new AppError('A primeira parcela não pode ser maior que o total da venda.', 400)
  }

  if (normalizedInitialPayment > 0 && payments.length === 0) {
    throw new AppError('Informe o valor da primeira parcela para vendas parceladas.', 400)
  }
}

function normalizeSaleDeliveryState(sale: { isDelivery?: boolean | null; deliveryStatus?: string | null; status?: string | null }) {
  const hasStoredStatus = sale.deliveryStatus !== undefined || sale.status !== undefined
  if (hasStoredStatus) {
    const deliveryStatus = normalizeSaleDeliveryStatus(sale.deliveryStatus ?? sale.status)
    return {
      isDelivery: typeof sale.isDelivery === 'boolean' ? sale.isDelivery : deliveryStatus === 'PENDING',
      deliveryStatus,
    }
  }

  const isDelivery = normalizeSaleDeliveryFlag(sale.isDelivery ?? undefined, undefined)
  return {
    isDelivery,
    deliveryStatus: getSaleDeliveryStatus(isDelivery),
  }
}

async function migrateLegacySaleDeliveryFields(userId: string) {
  const legacySales = await SaleModel.find({
    userId,
    $or: [
      { isDelivery: { $exists: false } },
      { isDelivery: null },
      { deliveryStatus: { $exists: false } },
      { status: { $exists: true } },
    ],
  })
    .select({ isDelivery: 1, deliveryStatus: 1, status: 1 })
    .lean<Array<{ _id: mongoose.Types.ObjectId; isDelivery?: boolean | null; deliveryStatus?: string | null; status?: string | null }>>()

  if (legacySales.length === 0) {
    return
  }

  await Promise.all(
    legacySales.map(async (sale) => {
      const normalized = normalizeSaleDeliveryState(sale)
      await SaleModel.updateOne(
        { _id: sale._id },
        {
          $set: {
            isDelivery: normalized.isDelivery,
            deliveryStatus: normalized.deliveryStatus,
          },
          $unset: { status: '' },
        }
      )
    })
  )
}

async function migrateLegacySalePaymentConditionFields(userId: string) {
  const legacySales = await SaleModel.find({
    userId,
    $or: [
      { paymentCondition: { $type: 'string' } },
      { 'paymentCondition.type': { $exists: false } },
      { payments: { $exists: false } },
      { paymentCondition: null },
    ],
  })
    .select({ paymentCondition: 1, paymentMethod: 1, payments: 1, initialPayment: 1, saleDate: 1, total: 1 })
    .lean<Array<{ _id: mongoose.Types.ObjectId; paymentCondition?: unknown; paymentMethod?: string; payments?: Array<{ amount?: number; date?: string; paymentMethod?: string }>; initialPayment?: number; saleDate?: string; total?: number }>>()

  if (legacySales.length === 0) {
    return
  }

  await Promise.all(
    legacySales.map(async (sale) => {
      const normalizedCondition = prepareSalePaymentCondition(sale.paymentCondition)
      const payments = buildSalePayments(
        {
          paymentCondition: normalizedCondition,
          paymentMethod: sale.paymentMethod,
          initialPayment: sale.initialPayment,
          payments: sale.payments,
          saleDate: sale.saleDate,
          total: sale.total ?? 0,
        },
        sale.total ?? 0,
        String(sale._id)
      )
      const paidAmount = getSalePaidAmount({ payments, paymentCondition: normalizedCondition, total: sale.total ?? 0 })
      const remainingAmount = getSaleRemainingAmount(sale.total ?? 0, paidAmount)
      await SaleModel.updateOne(
        { _id: sale._id },
        {
          $set: {
            paymentCondition: normalizedCondition,
            paymentMethod: normalizedCondition.type === 'A_VISTA' ? normalizeTextInput(sale.paymentMethod) : normalizeTextInput(payments[0]?.paymentMethod ?? sale.paymentMethod ?? ''),
            payments,
            paymentStatus: getSalePaymentStatus(sale.total ?? 0, paidAmount),
            paidAmount,
            remainingAmount,
            initialPayment: payments[0]?.amount ?? 0,
          },
        }
      )
    })
  )
}

function toSaleDTO(sale: SaleDocumentShape) {
  const normalizedDelivery = normalizeSaleDeliveryState(sale as unknown as { isDelivery?: boolean | null; deliveryStatus?: string | null; status?: string | null })
  const paymentCondition = prepareSalePaymentCondition(sale.paymentCondition as never)
  const payments = buildSalePayments(
    {
      paymentCondition,
      paymentMethod: sale.paymentMethod,
      payments: sale.payments as unknown as Array<{ amount?: number; date?: string; paymentMethod?: string; notes?: string }>,
      initialPayment: sale.initialPayment,
      saleDate: sale.saleDate,
      total: sale.total,
    },
    sale.total,
    String(sale._id)
  )
  const paidAmount = getSalePaidAmount({ payments, paymentCondition, total: sale.total })
  const remainingAmount = getSaleRemainingAmount(sale.total, paidAmount)
  const paymentStatus = getSalePaymentStatus(sale.total, paidAmount)

  return {
    id: String(sale._id),
    customerId: sale.customerId,
    customerName: sale.customerName,
    sellerId: sale.sellerId,
    sellerName: sale.sellerName,
    saleDate: sale.saleDate,
    isDelivery: normalizedDelivery.isDelivery,
    deliveryStatus: normalizedDelivery.deliveryStatus,
    deliveryDate: sale.deliveryDate || undefined,
    paymentMethod:
      paymentCondition.type === 'A_VISTA'
        ? sale.paymentMethod
        : sale.paymentMethod || payments[0]?.paymentMethod || paymentCondition.installments?.[0]?.paymentMethod || '',
    paymentCondition,
    payments,
    paymentStatus,
    paidAmount,
    remainingAmount,
    initialPayment: sale.initialPayment ?? payments[0]?.amount ?? 0,
    notes: sale.notes ?? '',
    subtotal: sale.subtotal,
    discount: sale.discount,
    shipping: sale.shipping,
    otherCosts: sale.otherCosts,
    total: sale.total,
    items: sale.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      brand: item.brand ?? '',
      product: normalizeText(item.product) || buildProductLabel(item.productName, item.unit, item.brand ?? ''),
      sku: item.sku,
      unit: item.unit,
      quantity: item.quantity,
      availableStock: item.availableStock,
      unitPrice: item.unitPrice,
      discount: item.discount ?? 0,
      subtotal: item.subtotal,
    })),
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
  }
}

function toHistoryDTO(sale: SaleDocumentShape) {
  return sale.history.map((entry) => ({ ...entry }))
}

function normalizeSaleItems(items: UpdateSaleInput['items'] | undefined) {
  return (items ?? []).map((item) => ({
    ...item,
    productId: normalizeText(item.productId),
    productName: normalizeText(item.productName),
    brand: normalizeText(item.brand),
    product: normalizeText(item.product) || buildProductLabel(item.productName, item.unit, item.brand ?? ''),
    sku: normalizeText(item.sku),
    unit: normalizeText(item.unit),
    quantity: toFiniteNumber(item.quantity, 0),
    unitPrice: toFiniteNumber(item.unitPrice, 0),
    availableStock: toFiniteNumber(item.availableStock, 0),
    discount: toFiniteNumber(item.discount, 0),
    subtotal: roundCurrency(toFiniteNumber(item.quantity, 0) * toFiniteNumber(item.unitPrice, 0) - toFiniteNumber(item.discount, 0)),
  }))
}

function normalizeSaleItemsFromDocument(items: SaleDocumentShape['items']) {
  return normalizeSaleItems(
    items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      brand: item.brand ?? '',
      product: item.product ?? '',
      sku: item.sku,
      unit: item.unit,
      quantity: item.quantity,
      availableStock: item.availableStock,
      unitPrice: item.unitPrice,
      discount: item.discount ?? 0,
    }))
  )
}

function buildTotals(items: ReturnType<typeof normalizeSaleItems>, discount = 0, shipping = 0, otherCosts = 0) {
  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.subtotal, 0))
  const total = calculateSaleTotal(subtotal, roundCurrency(discount), roundCurrency(shipping), roundCurrency(otherCosts))
  return { subtotal, total }
}

async function findSaleOrThrow(id: string, userId: string, session?: mongoose.ClientSession) {
  const parsed = saleIdParamSchema.parse({ id })

  if (!mongoose.isValidObjectId(parsed.id)) {
    throw new AppError('ID da venda inválido.', 400)
  }

  const sale = await SaleModel.findOne({ _id: parsed.id, userId }).session(session ?? null)
  if (!sale) {
    throw new AppError('Venda não encontrada.', 404)
  }

  return sale
}

function appendHistory(
  sale: SaleDocumentShape,
  action: 'created' | 'updated' | 'delivered' | 'cancelled' | 'payment_added',
  description: string
) {
  const saleId = String(sale._id)
  sale.set('history', [
    {
      id: `${saleId}-history-${sale.history.length + 1}`,
      saleId,
      action,
      description,
      user: sale.sellerName,
      date: nowISO(),
    },
    ...sale.history,
  ])
}

function toInventorySyncItems(items: ReturnType<typeof normalizeSaleItems>) {
  return items.map((item) => ({
    productId: normalizeText(item.productId),
    productName: normalizeText(item.productName),
    brand: normalizeText(item.brand),
    product: normalizeText(item.product) || buildProductLabel(item.productName, item.unit, item.brand ?? ''),
    sku: normalizeText(item.sku),
    unit: normalizeText(item.unit),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    salePrice: undefined,
  }))
}

function buildPaymentConditionSearchClauses(search: string) {
  const normalizedSearch = search.trim()
  if (!normalizedSearch) {
    return []
  }

  return [
    { paymentMethod: { $regex: escapeRegExp(normalizedSearch), $options: 'i' } },
    { 'paymentCondition.type': { $regex: escapeRegExp(normalizedSearch), $options: 'i' } },
    { 'paymentCondition.installments.paymentMethod': { $regex: escapeRegExp(normalizedSearch), $options: 'i' } },
    { 'paymentCondition.installments.status': { $regex: escapeRegExp(normalizedSearch), $options: 'i' } },
    { 'payments.paymentMethod': { $regex: escapeRegExp(normalizedSearch), $options: 'i' } },
    { paymentStatus: { $regex: escapeRegExp(normalizedSearch), $options: 'i' } },
  ]
}

export const SalesService = {
  async list(search?: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    await migrateLegacySaleDeliveryFields(currentUser.id)
    await migrateLegacySalePaymentConditionFields(currentUser.id)

    const parsed = saleListQuerySchema.parse({ search })
    const filter: Record<string, unknown> = { userId: currentUser.id }

    if (parsed.search) {
      filter.$or = [
        { customerName: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { sellerName: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { deliveryStatus: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        ...buildPaymentConditionSearchClauses(parsed.search),
      ]
    }

    if (parsed.deliveryStatus) {
      filter.deliveryStatus = normalizeSaleDeliveryStatus(parsed.deliveryStatus)
    }

    if (parsed.paymentMethod) {
      const clauses = buildPaymentConditionSearchClauses(parsed.paymentMethod)
      filter.$or = Array.isArray(filter.$or) ? [...(filter.$or as Array<Record<string, unknown>>), ...clauses] : clauses
    }

    const sales = await SaleModel.find(filter).sort({ createdAt: -1 }).lean<SaleDocumentShape[]>()
    return sales.map(toSaleDTO)
  },

  async getById(id: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    await migrateLegacySaleDeliveryFields(currentUser.id)
    await migrateLegacySalePaymentConditionFields(currentUser.id)
    return toSaleDTO(await findSaleOrThrow(id, currentUser.id))
  },

  async create(data: unknown) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const session = await mongoose.startSession()
    try {
      let createdDTO: ReturnType<typeof toSaleDTO> | undefined
      await session.withTransaction(async () => {
        const parsed = saleCreateSchema.parse(data)
        const items = normalizeSaleItems(parsed.items)
        const { subtotal, total } = buildTotals(items, parsed.discount ?? 0, parsed.shipping ?? 0, parsed.otherCosts ?? 0)
        const nextDeliveryState = normalizeSaleDeliveryState(parsed)
        const paymentCondition = prepareSalePaymentCondition(parsed.paymentCondition)
        const payments = buildSalePayments(parsed, total)
        validateSalePayments(paymentCondition.type, payments, total, parsed.initialPayment)
        const paidAmount = getSalePaidAmount({ payments, paymentCondition, total })
        const remainingAmount = getSaleRemainingAmount(total, paidAmount)
        const paymentStatus = getSalePaymentStatus(total, paidAmount)

        const created = new SaleModel({
          userId: currentUser.id,
          customerId: parsed.customerId,
          customerName: parsed.customerName,
          sellerId: parsed.sellerId,
          sellerName: parsed.sellerName,
          saleDate: parsed.saleDate,
          isDelivery: nextDeliveryState.isDelivery,
          deliveryStatus: nextDeliveryState.deliveryStatus,
          deliveryDate: nextDeliveryState.isDelivery ? parsed.deliveryDate ?? '' : '',
          paymentMethod: normalizePaymentMethod(paymentCondition.type, parsed.paymentMethod) || payments[0]?.paymentMethod || '',
          paymentCondition,
          payments,
          paymentStatus,
          paidAmount,
          remainingAmount,
          initialPayment: parsed.initialPayment ?? payments[0]?.amount ?? 0,
          notes: normalizeTextInput(parsed.notes),
          subtotal,
          discount: roundCurrency(parsed.discount ?? 0),
          shipping: roundCurrency(parsed.shipping ?? 0),
          otherCosts: roundCurrency(parsed.otherCosts ?? 0),
          total,
          items,
          history: [],
        })

        await created.save({ session })
        await InventoryService.applySaleItems(toInventorySyncItems(items), currentUser.id, session)
        appendHistory(created, 'created', 'Venda criada no sistema.')
        await created.save({ session })
        createdDTO = toSaleDTO(created)
      })

      if (!createdDTO) {
        throw new AppError('Não foi possível concluir a criação da venda.', 500)
      }

      return createdDTO
    } finally {
      session.endSession()
    }
  },

  async update(id: string, data: unknown) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    await migrateLegacySaleDeliveryFields(currentUser.id)
    await migrateLegacySalePaymentConditionFields(currentUser.id)
    const session = await mongoose.startSession()
    try {
      let updatedDTO: ReturnType<typeof toSaleDTO> | undefined
      await session.withTransaction(async () => {
        const parsed = saleUpdateSchema.parse(data)
        const sale = await findSaleOrThrow(id, currentUser.id, session)
        const previousItems = normalizeSaleItemsFromDocument(sale.items)
        const nextDeliveryState = normalizeSaleDeliveryState(parsed)

        if (parsed.customerId !== undefined) sale.customerId = parsed.customerId
        if (parsed.customerName !== undefined) sale.customerName = parsed.customerName
        if (parsed.sellerId !== undefined) sale.sellerId = parsed.sellerId
        if (parsed.sellerName !== undefined) sale.sellerName = parsed.sellerName
        if (parsed.saleDate !== undefined) sale.saleDate = parsed.saleDate
        if (parsed.isDelivery !== undefined) {
          sale.isDelivery = nextDeliveryState.isDelivery
          sale.deliveryStatus = nextDeliveryState.deliveryStatus
          if (!nextDeliveryState.isDelivery) {
            sale.deliveryDate = ''
          }
        }
        if (parsed.deliveryDate !== undefined) sale.deliveryDate = sale.isDelivery ? parsed.deliveryDate ?? '' : ''
        if (parsed.notes !== undefined) sale.notes = normalizeTextInput(parsed.notes)
        if (parsed.discount !== undefined) sale.discount = roundCurrency(parsed.discount)
        if (parsed.shipping !== undefined) sale.shipping = roundCurrency(parsed.shipping)
        if (parsed.otherCosts !== undefined) sale.otherCosts = roundCurrency(parsed.otherCosts)

        const nextItems = parsed.items !== undefined ? normalizeSaleItems(parsed.items) : previousItems
        if (parsed.items !== undefined) sale.set('items', nextItems)

        const { subtotal, total } = buildTotals(nextItems, sale.discount, sale.shipping, sale.otherCosts)
        sale.subtotal = subtotal
        sale.total = total

        if (parsed.paymentCondition !== undefined) {
          const nextPaymentCondition = prepareSalePaymentCondition(parsed.paymentCondition)
          sale.paymentCondition = nextPaymentCondition as never
          sale.paymentMethod = normalizePaymentMethod(nextPaymentCondition.type, parsed.paymentMethod ?? sale.paymentMethod)
        } else if (parsed.paymentMethod !== undefined && isImmediateSalePaymentCondition((sale.paymentCondition as { type?: string }).type ?? '')) {
          sale.paymentMethod = normalizeTextInput(parsed.paymentMethod)
        }

        sale.paymentCondition = prepareSalePaymentCondition(sale.paymentCondition as never) as never
        const nextPayments = buildSalePayments(
          {
            paymentCondition: sale.paymentCondition as never,
            paymentMethod: sale.paymentMethod,
            payments: sale.payments as unknown as Array<{ id?: string; amount?: number; date?: string; paymentMethod?: string; notes?: string }>,
            initialPayment: sale.initialPayment,
            saleDate: sale.saleDate,
            total,
          },
          total,
          String(sale._id)
        )
        const paidAmount = getSalePaidAmount({ payments: nextPayments, paymentCondition: sale.paymentCondition as never, total })
        sale.payments = nextPayments as never
        sale.paidAmount = paidAmount
        sale.remainingAmount = getSaleRemainingAmount(total, paidAmount)
        sale.paymentStatus = getSalePaymentStatus(total, paidAmount) as never
        sale.initialPayment = nextPayments[0]?.amount ?? sale.initialPayment ?? 0
        if (!isImmediateSalePaymentCondition((sale.paymentCondition as { type?: string }).type ?? '')) {
          sale.paymentMethod = sale.paymentMethod || nextPayments[0]?.paymentMethod || ''
        }

        sale.updatedAt = new Date()

        await sale.save({ session })
        await InventoryService.reconcileSaleItems(toInventorySyncItems(previousItems), toInventorySyncItems(nextItems), currentUser.id, session)
        appendHistory(sale, 'updated', 'Venda atualizada no sistema.')
        await sale.save({ session })
        updatedDTO = toSaleDTO(sale)
      })

      if (!updatedDTO) {
        throw new AppError('Não foi possível concluir a atualização da venda.', 500)
      }

      return updatedDTO
    } finally {
      session.endSession()
    }
  },

  async remove(id: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const session = await mongoose.startSession()
    try {
      let result: { id: string; deleted: true } | null = null
      await session.withTransaction(async () => {
        const sale = await findSaleOrThrow(id, currentUser.id, session)
        const items = normalizeSaleItemsFromDocument(sale.items)
        await InventoryService.revertSaleItems(toInventorySyncItems(items), currentUser.id, session)
        await sale.deleteOne({ session })
        result = { id: String(sale._id), deleted: true }
      })

      return result!
    } finally {
      session.endSession()
    }
  },

  async history(id: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    await migrateLegacySaleDeliveryFields(currentUser.id)
    await migrateLegacySalePaymentConditionFields(currentUser.id)
    return toHistoryDTO(await findSaleOrThrow(id, currentUser.id))
  },

  async addPayment(id: string, data: unknown) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const session = await mongoose.startSession()
    try {
      let updatedDTO: ReturnType<typeof toSaleDTO> | undefined
      await session.withTransaction(async () => {
        const sale = await findSaleOrThrow(id, currentUser.id, session)
        const paymentCondition = prepareSalePaymentCondition(sale.paymentCondition as never)
        const total = sale.total
        const currentPayments = buildSalePayments(
          {
            paymentCondition,
            paymentMethod: sale.paymentMethod,
            payments: sale.payments as unknown as Array<{ id?: string; amount?: number; date?: string; paymentMethod?: string; notes?: string }>,
            initialPayment: sale.initialPayment,
            saleDate: sale.saleDate,
            total,
          },
          total,
          String(sale._id)
        )
        const paidAmount = getSalePaidAmount({ payments: currentPayments, paymentCondition, total })
        const remainingAmount = getSaleRemainingAmount(total, paidAmount)

        const parsed = z.object({
          amount: z.preprocess((value) => normalizeDecimalValue(value), z.number().positive('Informe um valor maior que zero.')),
          date: z.string().trim().min(1, 'Informe a data do pagamento.'),
          paymentMethod: z.string().trim().transform(normalizeTextInput).optional(),
          notes: z.string().trim().transform(normalizeTextInput).optional(),
        }).parse(data)

        if (roundCurrency(parsed.amount - remainingAmount) > 0) {
          throw new AppError('O pagamento não pode ser maior que o saldo restante.', 400)
        }

        const payment = {
          id: `${sale._id}-payment-${currentPayments.length + 1}`,
          amount: roundCurrency(parsed.amount),
          date: new Date(`${parsed.date}T12:00:00`).toISOString(),
          paymentMethod: normalizeTextInput(parsed.paymentMethod ?? ''),
          notes: normalizeTextInput(parsed.notes ?? ''),
        }

        sale.payments = [...currentPayments, payment] as never
        sale.paidAmount = getSalePaidAmount({ payments: sale.payments as never, paymentCondition, total })
        sale.remainingAmount = getSaleRemainingAmount(total, sale.paidAmount)
        sale.paymentStatus = getSalePaymentStatus(total, sale.paidAmount) as never
        sale.initialPayment = currentPayments[0]?.amount ?? payment.amount
        if (!sale.paymentMethod.trim()) {
          sale.paymentMethod = payment.paymentMethod
        }

        appendHistory(sale, 'payment_added', `Pagamento registrado no valor de ${payment.amount.toFixed(2)}.`)
        sale.updatedAt = new Date()
        const updated = await sale.save({ session })
        updatedDTO = toSaleDTO(updated)
      })

      if (!updatedDTO) {
        throw new AppError('Não foi possível registrar o pagamento.', 500)
      }

      return updatedDTO
    } finally {
      session.endSession()
    }
  },

  async cancel(id: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const session = await mongoose.startSession()
    try {
      let cancelledDTO: ReturnType<typeof toSaleDTO> | undefined
      await session.withTransaction(async () => {
        const sale = await findSaleOrThrow(id, currentUser.id, session)
        const items = normalizeSaleItemsFromDocument(sale.items)
        await InventoryService.revertSaleItems(toInventorySyncItems(items), currentUser.id, session)
        appendHistory(sale, 'cancelled', 'Venda cancelada.')
        const updated = await sale.save({ session })
        cancelledDTO = toSaleDTO(updated)
      })

      if (!cancelledDTO) {
        throw new AppError('Não foi possível concluir o cancelamento da venda.', 500)
      }

      return cancelledDTO
    } finally {
      session.endSession()
    }
  },
}
