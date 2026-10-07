import { requireCurrentUser } from '@/server/auth/current-user'
import { AppError } from '@/server/errors/app-error'
import { UserModel } from '@/server/models/users/users.model'
import type { UserRole } from '@/types/user'

export { SINGLE_STORE_ID } from '@/server/store/constants'

export type StoreContext = Readonly<{
  storeId: string
  actorId: string
  role: UserRole
}>

export function resolveStoreContextForUser(user: { _id: unknown; storeId?: unknown; role: UserRole; isActive: boolean }): StoreContext {
  if (!user.isActive) {
    throw new AppError('Usuário desativado ou não encontrado.', 401)
  }

  if (typeof user.storeId !== 'string' || !user.storeId.trim()) {
    throw new AppError('Usuário sem autorização para a loja.', 403)
  }

  return { storeId: user.storeId.trim(), actorId: String(user._id), role: user.role }
}

export async function requireStoreContext(): Promise<StoreContext> {
  const currentUser = await requireCurrentUser()
  const user = await UserModel.findById(currentUser.id).select({ storeId: 1, role: 1, isActive: 1 }).lean()

  if (!user) {
    throw new AppError('Usuário desativado ou não encontrado.', 401)
  }

  return resolveStoreContextForUser(user)
}
