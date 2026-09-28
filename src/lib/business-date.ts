const BUSINESS_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function getTodayBusinessDate(now: Date = new Date(), timeZone = 'America/Sao_Paulo') {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now)
    .filter((part) => part.type !== 'literal')
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value])) as { year?: string; month?: string; day?: string }
  if (values.year && values.month && values.day) return `${values.year}-${values.month}-${values.day}`

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function normalizeBusinessDate(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''

  const datePart = trimmed.slice(0, 10)
  return BUSINESS_DATE_PATTERN.test(datePart) ? datePart : trimmed
}

export function formatBusinessDate(value: string | null | undefined) {
  const normalized = normalizeBusinessDate(value)
  const match = BUSINESS_DATE_PATTERN.exec(normalized)
  if (!match || !isBusinessDate(normalized)) return value || 'Sem data'

  return `${match[3]}/${match[2]}/${match[1]}`
}

export function isBusinessDate(value: string | null | undefined): value is string {
  const normalized = normalizeBusinessDate(value)
  if (!BUSINESS_DATE_PATTERN.test(normalized)) return false

  const [year, month, day] = normalized.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}
