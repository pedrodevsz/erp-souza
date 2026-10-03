import mongoose from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { requireStoreContext, type StoreContext } from '@/server/auth/store-context'
import { AppError } from '@/server/errors/app-error'
import { CustomerModel } from '@/server/models/customers/customers.model'
import { InventoryModel, type InventoryDocumentShape } from '@/server/models/inventories/inventories.model'
import {
  ProductReservationModel,
  type ProductReservationDTO,
  type ProductReservationDocumentShape,
} from '@/server/models/product-reservations/product-reservations.model'
import {
  productReservationCreateSchema,
  type CreateProductReservationInput,
} from '@/server/schemas/product-reservations/product-reservations.schema'
import { calculateAvailableStock } from '@/lib/inventory'
import { buildProductLabel } from '@/lib/products'

function nowISO() {
  return new Date().toISOString()
}

function toFiniteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toReservationDTO(reservation: ProductReservationDocumentShape): ProductReservationDTO {
  return {
    id: String(reservation._id),
    productId: reservation.productId,
    inventoryId: reservation.inventoryId,
    productName: reservation.productName,
    product: reservation.product,
    sku: reservation.sku,
    unit: reservation.unit,
    customerId: reservation.customerId,
    customerName: reservation.customerName,
    quantity: reservation.quantity,
    reservedAt: reservation.reservedAt,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  }
}

async function findInventoryByProductOrThrow(productId: string, storeId: string, session?: mongoose.ClientSession) {
  const inventory = await InventoryModel.findOne({
    storeId,
    $or: [{ productId }, { _id: productId }, { sku: productId }],
  }).session(session ?? null)

  if (!inventory) {
    throw new AppError('Produto não encontrado no estoque.', 404)
  }

  return inventory
}

async function findCustomerByIdOrThrow(customerId: string, storeId: string, session?: mongoose.ClientSession) {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new AppError('ID do cliente inválido.', 400)
  }

  const customer = await CustomerModel.findOne({ _id: customerId, storeId }).session(session ?? null)
  if (!customer) {
    throw new AppError('Cliente não encontrado.', 404)
  }

  return customer
}

function getInventoryAvailability(inventory: InventoryDocumentShape) {
  const currentStock = toFiniteNumber(inventory.currentStock, 0)
  const reservedStock = toFiniteNumber(inventory.reservedStock, 0)
  return calculateAvailableStock(currentStock, reservedStock)
}

export const ProductReservationService = {
  async create(data: unknown) {
    await connectToDatabase()
    const context: StoreContext = await requireStoreContext()
    const session = await mongoose.startSession()

    try {
      let createdDTO: ProductReservationDTO | undefined

      await session.withTransaction(async () => {
        const parsed: CreateProductReservationInput = productReservationCreateSchema.parse(data)
        const inventory = await findInventoryByProductOrThrow(parsed.productId, context.storeId, session)
        const customer = await findCustomerByIdOrThrow(parsed.customerId, context.storeId, session)
        const availableStock = getInventoryAvailability(inventory)

        if (parsed.quantity > availableStock) {
          throw new AppError('A quantidade reservada não pode ser maior que a disponível.', 409)
        }

        const nextReservedStock = toFiniteNumber(inventory.reservedStock, 0) + parsed.quantity
        inventory.reservedStock = nextReservedStock
        inventory.availableStock = calculateAvailableStock(toFiniteNumber(inventory.currentStock, 0), nextReservedStock)

        const reservation = new ProductReservationModel({
          storeId: context.storeId,
          userId: context.actorId,
          createdBy: context.actorId,
          updatedBy: context.actorId,
          productId: inventory.productId,
          inventoryId: String(inventory._id),
          productName: inventory.productName,
          product: inventory.product || buildProductLabel(inventory.productName, inventory.unit, inventory.brand),
          sku: inventory.sku,
          unit: inventory.unit,
          customerId: String(customer._id),
          customerName: customer.name,
          quantity: parsed.quantity,
          reservedAt: nowISO(),
        })

        const savedReservation = await reservation.save({ session })
        inventory.updatedBy = new mongoose.Types.ObjectId(context.actorId)
        await inventory.save({ session })
        createdDTO = toReservationDTO(savedReservation)
      })

      if (!createdDTO) {
        throw new AppError('Não foi possível concluir a reserva do produto.', 500)
      }

      return createdDTO
    } finally {
      session.endSession()
    }
  },

  async consumeForSale(
    items: Array<{ productId: string; quantity: number }>,
    customerId: string,
    context: StoreContext,
    session: mongoose.ClientSession
  ) {
    for (const item of items) {
      let remaining = item.quantity
      const reservations = await ProductReservationModel.find({
        storeId: context.storeId,
        customerId,
        productId: item.productId,
      }).sort({ reservedAt: 1, _id: 1 }).session(session)

      for (const reservation of reservations) {
        if (remaining <= 0) break
        const consumed = Math.min(remaining, reservation.quantity)
        const inventory = await InventoryModel.findOne({
          _id: reservation.inventoryId,
          storeId: context.storeId,
          productId: item.productId,
        }).session(session)
        if (!inventory) throw new AppError('Estoque da reserva não encontrado.', 409)

        inventory.reservedStock = Math.max(0, toFiniteNumber(inventory.reservedStock) - consumed)
        inventory.availableStock = calculateAvailableStock(toFiniteNumber(inventory.currentStock), inventory.reservedStock)
        inventory.updatedBy = new mongoose.Types.ObjectId(context.actorId)
        await inventory.save({ session })

        if (consumed === reservation.quantity) {
          await reservation.deleteOne({ session })
        } else {
          reservation.quantity -= consumed
          reservation.updatedBy = new mongoose.Types.ObjectId(context.actorId)
          await reservation.save({ session })
        }
        remaining -= consumed
      }
    }
  },

  async cancel(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    if (!mongoose.isValidObjectId(id)) throw new AppError('Reserva não encontrada.', 404)
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const reservation = await ProductReservationModel.findOne({ _id: id, storeId: context.storeId }).session(session)
        if (!reservation) throw new AppError('Reserva não encontrada.', 404)
        const inventory = await InventoryModel.findOne({
          _id: reservation.inventoryId,
          storeId: context.storeId,
          productId: reservation.productId,
        }).session(session)
        if (!inventory) throw new AppError('Estoque da reserva não encontrado.', 409)
        inventory.reservedStock = Math.max(0, toFiniteNumber(inventory.reservedStock) - reservation.quantity)
        inventory.availableStock = calculateAvailableStock(toFiniteNumber(inventory.currentStock), inventory.reservedStock)
        inventory.updatedBy = new mongoose.Types.ObjectId(context.actorId)
        await inventory.save({ session })
        await reservation.deleteOne({ session })
      })
      return { id, cancelled: true as const }
    } finally {
      session.endSession()
    }
  },
}
