import mongoose from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { requireStoreContext } from '@/server/auth/store-context'
import { AppError } from '@/server/errors/app-error'
import { SupplierModel, type SupplierDTO, type SupplierDocumentShape } from '@/server/models/suppliers/suppliers.model'
import {
  supplierCreateSchema,
  supplierListQuerySchema,
  type CreateSupplierInput,
} from '@/server/schemas/suppliers/suppliers.schema'
import { normalizeTextInput } from '@/lib/text'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeName(value: string) {
  return normalizeTextInput(value)
}

function toSupplierDTO(supplier: SupplierDocumentShape): SupplierDTO {
  return {
    id: String(supplier._id),
    name: supplier.name,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  }
}

async function findSupplierByIdOrThrow(id: string, storeId: string) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('ID do fornecedor inválido.', 400)
  }

  const supplier = await SupplierModel.findOne({ _id: id, storeId })

  if (!supplier) {
    throw new AppError('Fornecedor não encontrado.', 404)
  }

  return supplier
}

async function ensureSupplierNameIsUnique(name: string, storeId: string) {
  const normalizedName = normalizeName(name)
  const duplicate = await SupplierModel.findOne({
    storeId,
    name: { $regex: `^${escapeRegExp(normalizedName)}$`, $options: 'i' },
  }).lean<SupplierDocumentShape | null>()

  if (duplicate) {
    throw new AppError('Já existe um fornecedor cadastrado com este nome.', 409)
  }

  return normalizedName
}

export const SupplierService = {
  async list(search?: string) {
    await connectToDatabase()
    const context = await requireStoreContext()

    const parsed = supplierListQuerySchema.parse({ search })
    const filter: Record<string, unknown> = { storeId: context.storeId }
    if (parsed.search) {
      filter.name = { $regex: escapeRegExp(parsed.search), $options: 'i' }
    }

    const suppliers = await SupplierModel.find(filter).sort({ name: 1 }).lean<SupplierDocumentShape[]>()
    return suppliers.map(toSupplierDTO)
  },

  async create(data: unknown) {
    await connectToDatabase()
    const context = await requireStoreContext()

    const parsed: CreateSupplierInput = supplierCreateSchema.parse(data)
    const name = await ensureSupplierNameIsUnique(parsed.name, context.storeId)

    const created = await SupplierModel.create({ storeId: context.storeId, userId: context.actorId, createdBy: context.actorId, updatedBy: context.actorId, name })
    return toSupplierDTO(created)
  },

  async getById(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    return toSupplierDTO(await findSupplierByIdOrThrow(id, context.storeId))
  },

  async remove(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const supplier = await findSupplierByIdOrThrow(id, context.storeId)
    await supplier.deleteOne()
    return { id: String(supplier._id), deleted: true }
  },
}
