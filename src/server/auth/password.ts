import bcrypt from 'bcryptjs'

export const PASSWORD_HASH_ROUNDS = 12

export async function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}
