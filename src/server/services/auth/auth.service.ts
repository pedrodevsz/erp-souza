import { connectToDatabase } from '@/server/db/mongodb'
import { AppError } from '@/server/errors/app-error'
import { verifyPassword } from '@/server/auth/password'
import type { SessionUser } from '@/types/user'
import { toPublicUser } from '@/server/models/users/user-public'
import { UserModel } from '@/server/models/users/users.model'
import { authLoginSchema } from '@/server/schemas/auth/auth.schema'

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
    const user = await UserModel.findOne({ isActive: true, username: parsed.username })

    if (user && (await verifyPassword(parsed.password, user.passwordHash))) {
      return toPublicUser(user)
    }

    throw new AppError('Usuário ou senha inválidos.', 401)
  },

  async me(actor?: SessionUser | null) {
    await connectToDatabase()
    return toPublicUser(await requireActiveUserFromSession(actor))
  },
}
