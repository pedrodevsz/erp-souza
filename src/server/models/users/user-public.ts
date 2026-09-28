import type { UserRole } from '@/types/user'
import type { UserDTO } from './users.model'

function toIsoOrNull(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }

  return null
}

export function toPublicUser(user: {
  _id: unknown
  username: string
  role: UserRole
  isActive: boolean
  createdAt?: unknown
  updatedAt?: unknown
}): UserDTO {
  return {
    id: String(user._id),
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    createdAt: toIsoOrNull(user.createdAt),
    updatedAt: toIsoOrNull(user.updatedAt),
  }
}

export { toIsoOrNull }
