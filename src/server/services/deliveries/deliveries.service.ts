import mongoose, { type ClientSession } from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { requireStoreContext, type StoreContext } from '@/server/auth/store-context'
import { AppError } from '@/server/errors/app-error'
import { DeliveryModel, type DeliveryDocumentShape } from '@/server/models/deliveries/deliveries.model'
import { CustomerModel } from '@/server/models/customers/customers.model'
import { SaleModel, type SaleDocumentShape } from '@/server/models/sales/sales.model'
import {
  deliveryIdParamSchema,
  deliveryItemIdParamSchema,
  deliveryListQuerySchema,
  deliveryUpdateSchema,
  type UpdateDeliveryInput,
} from '@/server/schemas/deliveries/deliveries.schema'
import { createSaleReference } from '@/lib/sales'
import { recalculateDeliveryStatus } from '@/lib/deliveries'
import { completeDeliveryItems } from '@/lib/delivery-sync'
import { normalizeTextInput } from '@/lib/text'
import type { Delivery, DeliveryItem, DeliveryStatus } from '@/types/delivery'

function nowISO() {
  return new Date().toISOString()
}

function isSameOrAfter(value: string, compare: string) {
  return new Date(value).getTime() >= new Date(compare).getTime()
}

function isSameOrBefore(value: string, compare: string) {
  return new Date(value).getTime() <= new Date(compare).getTime()
}

function normalizeOptionalText(value: string | undefined) {
  return normalizeTextInput(value)
}

async function syncSaleDeliveryStatus(context: StoreContext, delivery: Pick<DeliveryDocumentShape, 'saleId' | 'status'>, session?: ClientSession) {
  await SaleModel.updateOne(
    { _id: delivery.saleId, storeId: context.storeId },
    {
      $set: {
        isDelivery: true,
        deliveryStatus: delivery.status === 'DELIVERED' || delivery.status === 'CANCELLED' ? delivery.status : 'PENDING',
        updatedBy: context.actorId,
      },
    },
    { session: session ?? undefined }
  )
}

function toDeliveryItem(item: DeliveryItem): DeliveryItem {
  return {
    id: String((item as DeliveryItem & { id?: string }).id ?? ''),
    productId: normalizeTextInput(item.productId),
    productName: normalizeTextInput(item.productName),
    sku: normalizeTextInput(item.sku),
    quantity: Number(item.quantity ?? 0),
    unit: normalizeTextInput(item.unit),
    delivered: Boolean(item.delivered),
    deliveredAt: item.deliveredAt,
  }
}

function toDeliveryDTO(delivery: DeliveryDocumentShape): Delivery {
  const dto: Delivery = {
    id: String(delivery._id),
    saleId: delivery.saleId,
    saleNumber: delivery.saleNumber,
    customerId: delivery.customerId,
    customerName: delivery.customerName,
    customerPhone: delivery.customerPhone ?? '',
    address: {
      street: delivery.address?.street ?? '',
      number: delivery.address?.number ?? '',
      complement: delivery.address?.complement ?? '',
      district: delivery.address?.district ?? '',
    },
    scheduledDate: delivery.scheduledDate,
    deliveredAt: delivery.deliveredAt || undefined,
    status: delivery.status as DeliveryStatus,
    driverName: delivery.driverName || '',
    notes: delivery.notes || '',
    items: (delivery.items ?? []).map((item) => toDeliveryItem(item as DeliveryItem)),
    createdAt: delivery.createdAt.toISOString(),
    updatedAt: delivery.updatedAt.toISOString(),
  }

  return {
    ...dto,
    status: recalculateDeliveryStatus(dto),
    deliveredAt: recalculateDeliveryStatus(dto) === 'DELIVERED' ? dto.deliveredAt : undefined,
  }
}

function buildDeliveryFromSale(
  context: StoreContext,
  sale: SaleDocumentShape,
  customer: { phone?: string; addresses?: Array<{ street?: string; number?: string; complement?: string; district?: string }> } | null
) {
  const firstAddress = customer?.addresses?.[0]
  const delivered = sale.deliveryStatus !== 'PENDING'
  const items: DeliveryItem[] = sale.items.map((item) => ({
    id: `${String(sale._id)}-item-${item.sku}`,
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unit: item.unit,
    delivered,
    deliveredAt: delivered ? nowISO() : undefined,
  }))

  return {
    storeId: context.storeId,
    userId: sale.userId,
    createdBy: context.actorId,
    updatedBy: context.actorId,
    saleId: String(sale._id),
    saleNumber: createSaleReference(String(sale._id)),
    customerId: sale.customerId,
    customerName: sale.customerName,
    customerPhone: normalizeOptionalText(customer?.phone),
    address: {
      street: normalizeOptionalText(firstAddress?.street),
      number: normalizeOptionalText(firstAddress?.number),
      complement: normalizeOptionalText(firstAddress?.complement),
      district: normalizeOptionalText(firstAddress?.district),
    },
    scheduledDate: sale.deliveryDate || sale.saleDate,
    deliveredAt: delivered ? nowISO() : undefined,
    status: (delivered ? 'DELIVERED' : 'PENDING') as DeliveryStatus,
    driverName: '',
    notes: normalizeOptionalText(sale.notes),
    items,
  }
}

async function syncDeliveriesFromSales(context: StoreContext, session?: ClientSession) {
  const deliveries = await DeliveryModel.find({ storeId: context.storeId }, { saleId: 1 }).session(session ?? null).lean<Array<{ saleId: string }>>()
  const existingSaleIds = new Set(deliveries.map((delivery) => delivery.saleId))

  const sales = await SaleModel.find({ storeId: context.storeId, status: 'ACTIVE', deliveryStatus: 'PENDING' }).sort({ createdAt: -1 }).lean<SaleDocumentShape[]>()
  const missingSales = sales.filter((sale) => !existingSaleIds.has(String(sale._id)))

  if (missingSales.length === 0) {
    return
  }

  const customerIds = Array.from(new Set(missingSales.map((sale) => sale.customerId)))
  const customers = await CustomerModel.find({ storeId: context.storeId, _id: { $in: customerIds } })
    .lean<Array<{ _id: mongoose.Types.ObjectId; phone?: string; addresses?: Array<{ street?: string; number?: string; complement?: string; district?: string }> }>>()

  const customerMap = new Map(customers.map((customer) => [String(customer._id), customer]))
  const docs = missingSales.map((sale) => buildDeliveryFromSale(context, sale, customerMap.get(sale.customerId) ?? null))

  await DeliveryModel.insertMany(docs, { ordered: false, session: session ?? null })
}

async function ensureDeliveriesSeeded(context: StoreContext, session?: ClientSession) {
  await syncDeliveriesFromSales(context, session)
}

async function findDeliveryOrThrow(id: string, context: StoreContext, session?: ClientSession) {
  const parsed = deliveryIdParamSchema.parse({ id })
  let delivery = await DeliveryModel.findOne({ _id: parsed.id, storeId: context.storeId }).session(session ?? null)
  if (!delivery) {
    await ensureDeliveriesSeeded(context, session)
    delivery = await DeliveryModel.findOne({ _id: parsed.id, storeId: context.storeId }).session(session ?? null)
  }

  if (!delivery) {
    throw new AppError('Entrega não encontrada.', 404)
  }

  return delivery
}

function ensureNotCancelled(delivery: DeliveryDocumentShape) {
  if (delivery.status === 'CANCELLED') {
    throw new AppError('Não é possível alterar uma entrega cancelada.', 400)
  }
}

function normalizeEffectiveStatus(delivery: Delivery) {
  return recalculateDeliveryStatus(delivery)
}

function applyUpdate(delivery: DeliveryDocumentShape, payload: UpdateDeliveryInput) {
  if (payload.saleNumber !== undefined) delivery.saleNumber = normalizeTextInput(payload.saleNumber)
  if (payload.customerName !== undefined) delivery.customerName = normalizeTextInput(payload.customerName)
  if (payload.customerPhone !== undefined) delivery.customerPhone = normalizeTextInput(payload.customerPhone)
  if (payload.address !== undefined) {
    delivery.address = {
      ...delivery.address,
      ...payload.address,
    }
  }
  if (payload.scheduledDate !== undefined) delivery.scheduledDate = payload.scheduledDate
  if (payload.notes !== undefined) delivery.notes = normalizeTextInput(payload.notes)
}

function matchesSearch(delivery: Delivery, search?: string) {
  const query = search?.trim().toLowerCase()
  if (!query) return true

  return (
    delivery.customerName.toLowerCase().includes(query) ||
    delivery.saleId.toLowerCase().includes(query) ||
    delivery.saleNumber.toLowerCase().includes(query) ||
    delivery.items.some((item) => item.productName.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query))
  )
}

export const DeliveryService = {
  async getAll(query?: unknown) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const parsed = deliveryListQuerySchema.parse(query ?? {})
    await ensureDeliveriesSeeded(context)

    const rawDeliveries = await DeliveryModel.find({ storeId: context.storeId }).sort({ createdAt: -1 }).lean<DeliveryDocumentShape[]>()
    const deliveries = rawDeliveries.map(toDeliveryDTO)

    return deliveries
      .filter((delivery) => {
        const effectiveStatus = normalizeEffectiveStatus(delivery)
        const matchesStatus = !parsed.status || effectiveStatus === parsed.status
        const matchesDateFrom = !parsed.dateFrom || isSameOrAfter(delivery.scheduledDate, parsed.dateFrom)
        const matchesDateTo = !parsed.dateTo || isSameOrBefore(delivery.scheduledDate, parsed.dateTo)
        const matchesDriver = !parsed.driverName || (delivery.driverName ?? '').toLowerCase().includes(parsed.driverName.toLowerCase())

        return matchesSearch(delivery, parsed.search) && matchesStatus && matchesDateFrom && matchesDateTo && matchesDriver
      })
      .map((delivery) => ({
        ...delivery,
        status: normalizeEffectiveStatus(delivery),
      }))
  },

  async getById(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const delivery = await findDeliveryOrThrow(id, context)
    return {
      ...toDeliveryDTO(delivery),
      status: normalizeEffectiveStatus(toDeliveryDTO(delivery)),
    }
  },

  async update(id: string, data: unknown) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const parsed = deliveryUpdateSchema.parse(data)
    const delivery = await findDeliveryOrThrow(id, context)
    ensureNotCancelled(delivery)

    if (parsed.status && !['PENDING', 'PARTIALLY_DELIVERED', 'LATE'].includes(parsed.status)) {
      throw new AppError('Status não permitido por esta rota.', 400)
    }

    applyUpdate(delivery, parsed)
    if (parsed.status) delivery.status = parsed.status
    delivery.status = normalizeEffectiveStatus(toDeliveryDTO(delivery))
    delivery.deliveredAt = delivery.status === 'DELIVERED' ? delivery.deliveredAt || nowISO() : undefined
    delivery.updatedAt = new Date()
    delivery.updatedBy = new mongoose.Types.ObjectId(context.actorId)
    await delivery.save()
    await syncSaleDeliveryStatus(context, delivery)
    return {
      ...toDeliveryDTO(delivery),
      status: normalizeEffectiveStatus(toDeliveryDTO(delivery)),
    }
  },


  async markItemAsDelivered(deliveryId: string, itemId: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const parsed = deliveryItemIdParamSchema.parse({ id: deliveryId, itemId })
    const delivery = await findDeliveryOrThrow(parsed.id, context)
    ensureNotCancelled(delivery)

    const item = delivery.items.find((entry) => entry.id === parsed.itemId)
    if (!item) throw new AppError('Item da entrega não encontrado.', 404)

    item.delivered = true
    item.deliveredAt = item.deliveredAt ?? nowISO()
    delivery.status = normalizeEffectiveStatus(toDeliveryDTO(delivery))
    delivery.deliveredAt = delivery.status === 'DELIVERED' ? delivery.deliveredAt || nowISO() : undefined
    delivery.updatedAt = new Date()
    delivery.updatedBy = new mongoose.Types.ObjectId(context.actorId)
    await delivery.save()
    await syncSaleDeliveryStatus(context, delivery)

    const dto = toDeliveryDTO(delivery)
    return { ...dto, status: normalizeEffectiveStatus(dto) }
  },

  async markItemAsPending(deliveryId: string, itemId: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const parsed = deliveryItemIdParamSchema.parse({ id: deliveryId, itemId })
    const delivery = await findDeliveryOrThrow(parsed.id, context)
    ensureNotCancelled(delivery)

    const item = delivery.items.find((entry) => entry.id === parsed.itemId)
    if (!item) throw new AppError('Item da entrega não encontrado.', 404)

    item.delivered = false
    item.deliveredAt = undefined
    delivery.status = normalizeEffectiveStatus(toDeliveryDTO(delivery))
    delivery.deliveredAt = undefined
    delivery.updatedAt = new Date()
    delivery.updatedBy = new mongoose.Types.ObjectId(context.actorId)
    await delivery.save()
    await syncSaleDeliveryStatus(context, delivery)

    const dto = toDeliveryDTO(delivery)
    return { ...dto, status: normalizeEffectiveStatus(dto) }
  },

  async completeDelivery(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const session = await mongoose.startSession()
    try {
      let completed: ReturnType<typeof toDeliveryDTO> | undefined
      await session.withTransaction(async () => {
        const delivery = await findDeliveryOrThrow(id, context, session)
        ensureNotCancelled(delivery)

        if ((delivery.items?.length ?? 0) === 0) {
          throw new AppError('Não é possível concluir uma entrega sem itens.', 400)
        }

        const deliveredAt = nowISO()
        delivery.items = completeDeliveryItems(delivery.items as DeliveryItem[], deliveredAt) as never
        delivery.status = 'DELIVERED'
        delivery.deliveredAt = deliveredAt
        delivery.updatedAt = new Date()
        delivery.updatedBy = new mongoose.Types.ObjectId(context.actorId)
        await delivery.save({ session })
        await syncSaleDeliveryStatus(context, delivery, session)
        completed = {
          ...toDeliveryDTO(delivery),
          status: 'DELIVERED' as DeliveryStatus,
          deliveredAt,
        }
      })

      if (!completed) {
        throw new AppError('Não foi possível concluir a entrega.', 500)
      }

      return completed
    } finally {
      session.endSession()
    }
  },

  async cancelDelivery(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const delivery = await findDeliveryOrThrow(id, context)
    delivery.status = 'CANCELLED'
    delivery.deliveredAt = undefined
    delivery.updatedAt = new Date()
    delivery.updatedBy = new mongoose.Types.ObjectId(context.actorId)
    await delivery.save()
    await syncSaleDeliveryStatus(context, delivery)
    return {
      ...toDeliveryDTO(delivery),
      status: 'CANCELLED' as DeliveryStatus,
    }
  },
}
