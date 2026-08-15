export type UserRole = 'ADMIN' | 'USER'

export type SessionUser = {
  userId: string
  name: string
  role: UserRole
}
