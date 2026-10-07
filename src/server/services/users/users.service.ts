import mongoose from 'mongoose'

import { hashPassword } from '@/server/auth/password'
import { requireStoreContext, type StoreContext } from '@/server/auth/store-context'
import { connectToDatabase } from '@/server/db/mongodb'
import { AppError } from '@/server/errors/app-error'
import { toPublicUser } from '@/server/models/users/user-public'
import { getDuplicateKeyDiagnostics, isUsernameDuplicateError } from '@/server/models/users/user-errors'
import { UserModel, type UserDocumentShape } from '@/server/models/users/users.model'
import { userCreateSchema, userIdParamSchema, userUpdateSchema, type UserUpdateInput } from '@/server/schemas/users/users.schema'

async function requireAdminStoreContext(): Promise<StoreContext> {
  const context = await requireStoreContext()
  if (context.role !== 'ADMIN') throw new AppError('Acesso restrito a administradores.', 403)
  return context
}

async function findUserOrThrow(id: string, storeId: string) {
  const parsed = userIdParamSchema.parse({ id })
  if (!mongoose.isValidObjectId(parsed.id)) {
    throw new AppError('ID do usuário inválido.', 400)
  }

  const user = await UserModel.findOne({ _id: parsed.id, storeId })
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404)
  }

  return user
}

function ensureManagedUser(user: { role: string }) {
  if (user.role !== 'USER') {
    throw new AppError('Somente usuários USER podem ser gerenciados por este painel.', 403)
  }
}

export const UserService = {
  async list() {
    await connectToDatabase()
    const context = await requireAdminStoreContext()

    const users = await UserModel.find({ storeId: context.storeId }).sort({ username: 1 }).lean()
    return users.map((user) => toPublicUser(user as UserDocumentShape))
  },

  async create(data: unknown) {
    await connectToDatabase()
    const context = await requireAdminStoreContext()

    const parsed = userCreateSchema.parse(data)
    const existing = await UserModel.findOne({ username: parsed.username }).select('_id').lean()
    if (existing) {
      throw new AppError('Este username já está em uso.', 409)
    }

    try {
      const created = await UserModel.create({
        username: parsed.username,
        passwordHash: await hashPassword(parsed.password),
        storeId: context.storeId,
        role: 'USER',
        isActive: true,
      })

      return toPublicUser(created)
    } catch (error) {
      if (isUsernameDuplicateError(error)) {
        throw new AppError('Este username já está em uso.', 409)
      }

      const diagnostics = getDuplicateKeyDiagnostics(error)
      if (diagnostics) console.error('[users] conflito de índice não relacionado a username', diagnostics)

      throw error
    }
  },

  async update(id: string, data: unknown) {
    await connectToDatabase()
    const context = await requireAdminStoreContext()
    const parsed: UserUpdateInput = userUpdateSchema.parse(data)
    const user = await findUserOrThrow(id, context.storeId)

    ensureManagedUser(user)

    if (String(user._id) === context.actorId && parsed.isActive === false) {
      throw new AppError('O administrador atual não pode desativar a própria conta.', 400)
    }

    if (parsed.password !== undefined) {
      user.passwordHash = await hashPassword(parsed.password)
    }

    if (parsed.isActive !== undefined) {
      user.isActive = parsed.isActive
    }

    return toPublicUser(await user.save())
  },
}
