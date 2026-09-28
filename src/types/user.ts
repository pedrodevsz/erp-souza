export type UserRole = 'ADMIN' | 'USER'

export type SessionUser = {
  userId: string
  username: string
  role: UserRole
}
