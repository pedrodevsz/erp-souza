import mongoose from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { AppError } from '@/server/errors/app-error'
import { requireCurrentUser } from '@/server/auth/current-user'
import { InventoryModel } from '@/server/models/inventories/inventories.model'
import { ProductModel, type ProductDTO, type ProductDocumentShape } from '@/server/models/products/products.model'
import {
  productCreateSchema,
  productListQuerySchema,
  type CreateProductInput,
} from '@/server/schemas/products/products.schema'
import { buildProductLabel, normalizeProductInput } from '@/lib/products'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toProductDTO(product: ProductDocumentShape): ProductDTO {
  return {
    id: String(product._id),
    name: product.name,
    unit: product.unit,
    brand: product.brand,
    product: product.product,
    salePrice: product.salePrice ?? 0,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

async function findProductByIdOrThrow(id: string, userId: string, session?: mongoose.ClientSession) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('ID do produto inválido.', 400)
  }

  const product = await ProductModel.findOne({ _id: id, userId }).session(session ?? null)
  if (!product) {
    throw new AppError('Produto não encontrado.', 404)
  }

  return product
}

async function ensureUniqueProduct(input: CreateProductInput, userId: string) {
  const normalized = normalizeProductInput(input)
  const duplicate = await ProductModel.findOne({
    userId,
    name: normalized.name,
    unit: normalized.unit,
    brand: normalized.brand,
  }).lean<ProductDocumentShape | null>()

  if (duplicate) {
    throw new AppError('Já existe um produto cadastrado com essa combinação de nome, unidade e marca.', 409)
  }

  return normalized
}

async function ensureUniqueProductUpdate(id: string, input: CreateProductInput, userId: string) {
  const normalized = normalizeProductInput(input)
  const duplicate = await ProductModel.findOne({
    _id: { $ne: id },
    userId,
    name: normalized.name,
    unit: normalized.unit,
    brand: normalized.brand,
  }).lean<ProductDocumentShape | null>()

  if (duplicate) {
    throw new AppError('Já existe um produto cadastrado com essa combinação de nome, unidade e marca.', 409)
  }

  return normalized
}

export const ProductService = {
  async list(search?: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()

    const parsed = productListQuerySchema.parse({ search })
    const filter: Record<string, unknown> = { userId: currentUser.id }
    if (parsed.search) {
      filter.$or = [
        { name: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { unit: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { brand: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        { product: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
      ]
    }

    const products = await ProductModel.find(filter).sort({ product: 1 }).lean<ProductDocumentShape[]>()
    return products.map(toProductDTO)
  },

  async create(data: unknown) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()

    const parsed = productCreateSchema.parse(data)
    const normalized = await ensureUniqueProduct(parsed, currentUser.id)
    const product = buildProductLabel(normalized.name, normalized.unit, normalized.brand)

    const created = await ProductModel.create({
      userId: currentUser.id,
      ...normalized,
      product,
    })

    return toProductDTO(created)
  },

  async getById(id: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    return toProductDTO(await findProductByIdOrThrow(id, currentUser.id))
  },

  async update(id: string, data: unknown) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const session = await mongoose.startSession()

    try {
      let updatedProduct: ProductDocumentShape | null = null

      await session.withTransaction(async () => {
        const product = await findProductByIdOrThrow(id, currentUser.id, session)
        const parsed = productCreateSchema.partial().strict().parse(data)

        const nextName = parsed.name ?? product.name
        const nextUnit = parsed.unit ?? product.unit
        const nextBrand = parsed.brand ?? product.brand
        const normalized = await ensureUniqueProductUpdate(
          id,
          {
            name: nextName,
            unit: nextUnit,
            brand: nextBrand,
          },
          currentUser.id
        )

        const inventory = await InventoryModel.findOne({
          userId: currentUser.id,
          $or: [
            { productId: String(product._id) },
            {
              productName: product.name,
              unit: product.unit,
              brand: product.brand,
            },
          ],
        }).session(session)
        if (inventory) {
          const duplicateInventory = await InventoryModel.findOne({
            userId: currentUser.id,
            _id: { $ne: inventory._id },
            productName: normalized.name,
            unit: normalized.unit,
            brand: normalized.brand,
          }).session(session)

          if (duplicateInventory) {
            throw new AppError('Já existe um item de estoque cadastrado com essa combinação.', 409)
          }

          inventory.productName = normalized.name
          inventory.unit = normalized.unit
          inventory.brand = normalized.brand
          inventory.product = buildProductLabel(normalized.name, normalized.unit, normalized.brand)
          inventory.productId = String(product._id)
        }

        product.name = normalized.name
        product.unit = normalized.unit
        product.brand = normalized.brand
        product.product = buildProductLabel(normalized.name, normalized.unit, normalized.brand)

        updatedProduct = await product.save({ session })
        if (inventory) {
          await inventory.save({ session })
        }
      })

      if (!updatedProduct) {
        throw new AppError('Não foi possível atualizar o produto.', 500)
      }

      return toProductDTO(updatedProduct)
    } finally {
      session.endSession()
    }
  },

  async remove(id: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const product = await findProductByIdOrThrow(id, currentUser.id)
    await product.deleteOne()
    return { id: String(product._id), deleted: true }
  },
}
