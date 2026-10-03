import mongoose from 'mongoose'

import { connectToDatabase } from '@/server/db/mongodb'
import { requireStoreContext } from '@/server/auth/store-context'
import { AppError } from '@/server/errors/app-error'
import { EmployeeModel, type EmployeeDTO, type EmployeeDocumentShape } from '@/server/models/employees/employees.model'
import { DEFAULT_EMPLOYEE_ROLE } from '@/lib/employees/employee-roles'
import {
  employeeCreateSchema,
  employeeIdParamSchema,
  employeeListQuerySchema,
  employeeUpdateSchema,
  type UpdateEmployeeInput,
} from '@/server/schemas/employees/employees.schema'
import { normalizeSearchInput, normalizeTextInput } from '@/lib/text'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizePhone(value?: string) {
  return (value ?? '').trim()
}

function toEmployeeDTO(employee: EmployeeDocumentShape): EmployeeDTO {
  return {
    id: String(employee._id),
    name: employee.name,
    role: employee.role ?? DEFAULT_EMPLOYEE_ROLE,
    phone: employee.phone?.trim() || undefined,
    active: employee.active,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  }
}

async function findEmployeeByIdOrThrow(id: string, storeId: string) {
  const parsed = employeeIdParamSchema.parse({ id })
  if (!mongoose.isValidObjectId(parsed.id)) {
    throw new AppError('ID do funcionário inválido.', 400)
  }

  const employee = await EmployeeModel.findOne({ _id: parsed.id, storeId })
  if (!employee) {
    throw new AppError('Funcionário não encontrado.', 404)
  }

  return employee
}

function applyEmployeePayload(
  employee: EmployeeDocumentShape,
  data: UpdateEmployeeInput
) {
  if (data.name !== undefined) {
    employee.name = normalizeTextInput(data.name)
  }

  if (data.role !== undefined) {
    employee.role = data.role
  }

  if (data.phone !== undefined) {
    employee.phone = normalizePhone(data.phone)
  }

  if (data.active !== undefined) {
    employee.active = data.active
  }
}

export const EmployeeService = {
  async list(search?: string) {
    await connectToDatabase()
    const context = await requireStoreContext()

    const parsed = employeeListQuerySchema.parse({ search })
    const query = normalizeSearchInput(parsed.search)
    const filter: Record<string, unknown> = { storeId: context.storeId }
    if (query) {
      filter.$or = [
        { name: { $regex: escapeRegExp(query), $options: 'i' } },
        { phone: { $regex: escapeRegExp(query), $options: 'i' } },
      ]
    }

    const employees = await EmployeeModel.find(filter).sort({ name: 1 }).lean<EmployeeDocumentShape[]>()
    return employees.map(toEmployeeDTO)
  },

  async getById(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    return toEmployeeDTO(await findEmployeeByIdOrThrow(id, context.storeId))
  },

  async create(data: unknown) {
    await connectToDatabase()
    const context = await requireStoreContext()

    const parsed = employeeCreateSchema.parse(data)
    const created = await EmployeeModel.create({
      storeId: context.storeId,
      userId: context.actorId,
      createdBy: context.actorId,
      updatedBy: context.actorId,
      name: parsed.name,
      role: parsed.role,
      phone: normalizePhone(parsed.phone),
      active: parsed.active ?? true,
    })

    return toEmployeeDTO(created)
  },

  async update(id: string, data: unknown) {
    await connectToDatabase()
    const context = await requireStoreContext()

    const parsed: UpdateEmployeeInput = employeeUpdateSchema.parse(data)
    const employee = await findEmployeeByIdOrThrow(id, context.storeId)

    applyEmployeePayload(employee, parsed)
    employee.updatedBy = new mongoose.Types.ObjectId(context.actorId)

    return toEmployeeDTO(await employee.save())
  },

  async remove(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const employee = await findEmployeeByIdOrThrow(id, context.storeId)
    await employee.deleteOne()
    return { id: String(employee._id), deleted: true }
  },

  async toggleStatus(id: string) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const employee = await findEmployeeByIdOrThrow(id, context.storeId)
    employee.active = !employee.active
    employee.updatedBy = new mongoose.Types.ObjectId(context.actorId)
    return toEmployeeDTO(await employee.save())
  },
}
