import mongoose from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { requireCurrentUser } from '@/server/auth/current-user'
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

async function findInventoryByProductOrThrow(productId: string, userId: string, session?: mongoose.ClientSession) {
  const inventory = await InventoryModel.findOne({
    userId,
    $or: [{ productId }, { _id: productId }, { sku: productId }],
  }).session(session ?? null)

  if (!inventory) {
    throw new AppError('Produto não encontrado no estoque.', 404)
  }

  return inventory
}

async function findCustomerByIdOrThrow(customerId: string, userId: string, session?: mongoose.ClientSession) {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new AppError('ID do cliente inválido.', 400)
  }

  const customer = await CustomerModel.findOne({ _id: customerId, userId }).session(session ?? null)
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
    const currentUser = await requireCurrentUser()
    const session = await mongoose.startSession()

    try {
      let createdDTO: ProductReservationDTO | undefined

      await session.withTransaction(async () => {
        const parsed: CreateProductReservationInput = productReservationCreateSchema.parse(data)
        const inventory = await findInventoryByProductOrThrow(parsed.productId, currentUser.id, session)
        const customer = await findCustomerByIdOrThrow(parsed.customerId, currentUser.id, session)
        const availableStock = getInventoryAvailability(inventory)

        if (parsed.quantity > availableStock) {
          throw new AppError('A quantidade reservada não pode ser maior que a disponível.', 409)
        }

        const nextReservedStock = toFiniteNumber(inventory.reservedStock, 0) + parsed.quantity
        inventory.reservedStock = nextReservedStock
        inventory.availableStock = calculateAvailableStock(toFiniteNumber(inventory.currentStock, 0), nextReservedStock)

        const reservation = new ProductReservationModel({
          userId: currentUser.id,
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
}
