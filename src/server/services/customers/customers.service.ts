import mongoose from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { requireStoreContext } from '@/server/auth/store-context'
import { AppError } from '@/server/errors/app-error'
import { CustomerModel, type CustomerDTO, type CustomerDocumentShape } from '@/server/models/customers/customers.model'
import {
  customerCreateSchema,
  customerIdParamSchema,
  customerListQuerySchema,
  customerUpdateSchema,
  type UpdateCustomerInput,
} from '@/server/schemas/customers/customers.schema'
import { normalizeTextInput } from '@/lib/text'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.replace(/\D/g, '')
  return normalized.length > 0 ? normalized : null
}

function normalizeDocument(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.replace(/\D/g, '')
  return normalized.length > 0 ? normalized : null
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim() ?? ''
  return normalized.length > 0 ? normalized : undefined
}

function hasMeaningfulText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

type CustomerAddressInput = NonNullable<UpdateCustomerInput['addresses']>[number]

function normalizeAddress(address?: CustomerAddressInput | null) {
  return {
    zipCode: normalizeOptionalText(address?.zipCode),
    street: normalizeTextInput(address?.street),
    number: normalizeTextInput(address?.number),
    complement: normalizeTextInput(address?.complement),
    district: normalizeTextInput(address?.district),
  }
}

function normalizeAddresses(addresses?: UpdateCustomerInput['addresses'] | null) {
  const items = (addresses ?? []).map((address) => normalizeAddress(address))
  return items.filter((address) => Object.values(address).some((value) => hasMeaningfulText(value)))
}

function toCustomerDTO(customer: CustomerDocumentShape): CustomerDTO {
  return {
    id: String(customer._id),
    name: customer.name,
    document: customer.document ?? '',
    phone: customer.phone ?? '',
    addresses: (customer.addresses ?? []).map((address) => ({
      zipCode: address?.zipCode ?? '',
      street: address?.street ?? '',
      number: address?.number ?? '',
      complement: address?.complement ?? '',
      district: address?.district ?? '',
    })),
    notes: customer.notes ?? '',
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  }
}

async function findCustomerOrThrow(id: string, storeId: string) {
  const parsed = customerIdParamSchema.parse({ id })

  if (!mongoose.isValidObjectId(parsed.id)) {
    throw new AppError('ID do cliente inválido.', 400)
  }

  const customer = await CustomerModel.findOne({ _id: parsed.id, storeId })
  if (!customer) {
    throw new AppError('Cliente não encontrado.', 404)
  }

  return customer
}

async function ensureDocumentIsUnique(document: string | undefined, storeId: string, excludeId?: string) {
  const normalizedDocument = normalizeDocument(document)

  if (!normalizedDocument) {
    return undefined
  }

  const duplicate = await CustomerModel.findOne({
    storeId,
    document: normalizedDocument,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean<CustomerDocumentShape | null>()

  if (duplicate) {
    throw new AppError('Já existe um cliente cadastrado com este CPF/CNPJ.', 409)
  }

  return normalizedDocument
}

export const CustomerService = {
  async list(search?: string) {
    await connectToDatabase()
    const context = await requireStoreContext()

    const parsed = customerListQuerySchema.parse({ search })
    const normalizedSearch = parsed.search ? normalizeDocument(parsed.search) : ''
    const filter: Record<string, unknown> = { storeId: context.storeId }
    if (parsed.search) {
      filter.$or = [
        { name: { $regex: escapeRegExp(parsed.search), $options: 'i' } },
        ...(normalizedSearch ? [{ document: { $regex: escapeRegExp(normalizedSearch), $options: 'i' } }] : []),
      ]
    }

    const customers = await CustomerModel.find(filter).sort({ createdAt: -1 }).lean<CustomerDocumentShape[]>()
    return customers.map(toCustomerDTO)
  },

  async getById(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    return toCustomerDTO(await findCustomerOrThrow(id, context.storeId))
  },

  async create(data: unknown) {
    await connectToDatabase()
    const context = await requireStoreContext()

    const parsed = customerCreateSchema.parse(data)
    const phone = normalizePhone(parsed.phone)
    const document = await ensureDocumentIsUnique(parsed.document, context.storeId)

    const created = await CustomerModel.create({
      storeId: context.storeId,
      userId: context.actorId,
      createdBy: context.actorId,
      updatedBy: context.actorId,
      name: normalizeTextInput(parsed.name),
      ...(document ? { document } : {}),
      ...(phone ? { phone } : {}),
      addresses: normalizeAddresses(parsed.addresses),
      notes: normalizeTextInput(parsed.notes),
    })

    return toCustomerDTO(created)
  },

  async update(id: string, data: unknown) {
    await connectToDatabase()
    const context = await requireStoreContext()

    const parsed = customerUpdateSchema.parse(data)
    const customer = await findCustomerOrThrow(id, context.storeId)

    if (parsed.document !== undefined) {
      const document = await ensureDocumentIsUnique(parsed.document, context.storeId, customer.id)
      customer.set('document', document)
    }

    if (parsed.name !== undefined) customer.name = normalizeTextInput(parsed.name)
    if (parsed.phone !== undefined) customer.set('phone', normalizePhone(parsed.phone))
    if (parsed.notes !== undefined) customer.notes = normalizeTextInput(parsed.notes)
    if (parsed.addresses !== undefined) customer.set('addresses', normalizeAddresses(parsed.addresses))
    customer.updatedBy = new mongoose.Types.ObjectId(context.actorId)

    return toCustomerDTO(await customer.save())
  },

  async remove(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const customer = await findCustomerOrThrow(id, context.storeId)
    await customer.deleteOne()
    return { id: String(customer._id), deleted: true }
  },
}
