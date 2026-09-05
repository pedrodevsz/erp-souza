import { connectToDatabase } from '@/server/db/mongodb'
import { AppError } from '@/server/errors/app-error'
import { verifyNumericPassword } from '@/server/auth/password'
import type { SessionUser } from '@/types/user'
import {
  UserModel,
  type UserDTO,
  type UserDocumentShape,
} from '@/server/models/users/users.model'
import { authLoginSchema } from '@/server/schemas/auth/auth.schema'

function toUserDTO(user: UserDocumentShape): UserDTO {
  return {
    id: String(user._id),
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

async function requireActiveUserFromSession(actor?: SessionUser | null) {
  if (!actor) {
    throw new AppError('Acesso não autorizado.', 401)
  }

  const user = await UserModel.findById(actor.userId)
  if (!user || !user.isActive) {
    throw new AppError('Usuário desativado ou não encontrado.', 401)
  }

  return user
}

export const AuthService = {
  async login(data: unknown) {
    await connectToDatabase()

    const parsed = authLoginSchema.parse(data)
    const user = await UserModel.findOne({ isActive: true, name: parsed.name })

    if (user && (await verifyNumericPassword(parsed.password, user.passwordHash))) {
      return toUserDTO(user)
    }

    throw new AppError('Usuário ou senha inválidos.', 401)
  },

  async me(actor?: SessionUser | null) {
    await connectToDatabase()
    return toUserDTO(await requireActiveUserFromSession(actor))
  },
}
