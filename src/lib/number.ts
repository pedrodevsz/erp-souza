export function parseNumericInput(value: string) {
  const normalized = value.trim().replace(',', '.')

  if (!normalized) {
    return 0
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizeFiniteNumber(value: number) {
  return Number.isFinite(value) ? value : 0
}
