import mongoose from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { requireCurrentUser } from '@/server/auth/current-user'
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

async function findSupplierByIdOrThrow(id: string, userId: string) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('ID do fornecedor inválido.', 400)
  }

  const supplier = await SupplierModel.findOne({ _id: id, userId })

  if (!supplier) {
    throw new AppError('Fornecedor não encontrado.', 404)
  }

  return supplier
}

async function ensureSupplierNameIsUnique(name: string, userId: string) {
  const normalizedName = normalizeName(name)
  const duplicate = await SupplierModel.findOne({
    userId,
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
    const currentUser = await requireCurrentUser()

    const parsed = supplierListQuerySchema.parse({ search })
    const filter: Record<string, unknown> = { userId: currentUser.id }
    if (parsed.search) {
      filter.name = { $regex: escapeRegExp(parsed.search), $options: 'i' }
    }

    const suppliers = await SupplierModel.find(filter).sort({ name: 1 }).lean<SupplierDocumentShape[]>()
    return suppliers.map(toSupplierDTO)
  },

  async create(data: unknown) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()

    const parsed: CreateSupplierInput = supplierCreateSchema.parse(data)
    const name = await ensureSupplierNameIsUnique(parsed.name, currentUser.id)

    const created = await SupplierModel.create({ userId: currentUser.id, name })
    return toSupplierDTO(created)
  },

  async getById(id: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    return toSupplierDTO(await findSupplierByIdOrThrow(id, currentUser.id))
  },

  async remove(id: string) {
    await connectToDatabase()
    const currentUser = await requireCurrentUser()
    const supplier = await findSupplierByIdOrThrow(id, currentUser.id)
    await supplier.deleteOne()
    return { id: String(supplier._id), deleted: true }
  },
}
