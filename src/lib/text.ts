export function normalizeTextInput(value: string | null | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR')
}

export function normalizeOptionalTextInput(value: string | null | undefined) {
  const normalized = normalizeTextInput(value)
  return normalized.length > 0 ? normalized : ''
}

export function normalizeNullableTextInput(value: string | null | undefined) {
  const normalized = normalizeTextInput(value)
  return normalized.length > 0 ? normalized : null
}

export function normalizeDocumentInput(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '')
}

export function normalizeSearchInput(value: string | null | undefined) {
  return (value ?? '').trim()
}
