type DuplicateKeyError = {
  code?: number
  index?: string
  keyPattern?: Record<string, unknown>
  keyValue?: Record<string, unknown>
}

function asDuplicateKeyError(error: unknown): DuplicateKeyError | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const duplicate = error as DuplicateKeyError
  return duplicate.code === 11000 ? duplicate : null
}

export function isUsernameDuplicateError(error: unknown) {
  const duplicate = asDuplicateKeyError(error)
  if (!duplicate) return false
  return Boolean(duplicate.keyPattern?.username !== undefined || duplicate.keyValue?.username !== undefined || duplicate.index === 'username_1')
}

export function getDuplicateKeyDiagnostics(error: unknown) {
  const duplicate = asDuplicateKeyError(error)
  if (!duplicate) return null
  return { index: duplicate.index ?? null, keyPattern: duplicate.keyPattern ?? null }
}
