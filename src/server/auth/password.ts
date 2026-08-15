import bcrypt from 'bcryptjs'

function normalizePassword(password: string) {
  return password.trim()
}

export function normalizeNumericPassword(password: string) {
  return normalizePassword(password)
}

export async function hashNumericPassword(password: string) {
  const normalized = normalizeNumericPassword(password)
  return bcrypt.hash(normalized, 10)
}

export async function verifyNumericPassword(password: string, passwordHash: string) {
  const normalized = normalizeNumericPassword(password)

  return bcrypt.compare(normalized, passwordHash)
}
