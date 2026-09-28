const BUG_SIGNATURE = /^(\d{4})-(\d{2})-(\d{2})T15:00:00\.000Z$/

export type SaleDateAuditRecord = {
  id: string
  saleNumber: string | null
  saleDate: string | null
  createdAt: string | null
  createdAtLocalDate: string | null
  proposedSaleDate: string | null
  classification: 'NORMAL' | 'AUTO_CANDIDATE' | 'AMBIGUOUS'
  reason: string
}

function toDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return null
}

function formatLocalDate(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(value)
    .filter((part) => part.type !== 'literal')
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value])) as { year?: string; month?: string; day?: string }
  return values.year && values.month && values.day ? `${values.year}-${values.month}-${values.day}` : null
}

export function auditSaleDate(
  sale: { _id: unknown; saleDate?: unknown; createdAt?: unknown; saleNumber?: unknown; number?: unknown },
  timeZone = 'America/Sao_Paulo'
): SaleDateAuditRecord {
  const saleDate = typeof sale.saleDate === 'string' ? sale.saleDate : null
  const createdAt = toDate(sale.createdAt)
  const createdAtLocalDate = createdAt ? formatLocalDate(createdAt, timeZone) : null
  const storedDate = saleDate?.slice(0, 10) ?? null
  const hasKnownBugSignature = Boolean(saleDate && BUG_SIGNATURE.test(saleDate) && createdAt && createdAtLocalDate && storedDate === createdAt.toISOString().slice(0, 10) && createdAtLocalDate !== storedDate)

  let classification: SaleDateAuditRecord['classification'] = 'NORMAL'
  let reason = 'A data armazenada não apresenta a assinatura conhecida do bug.'

  if (hasKnownBugSignature) {
    classification = 'AUTO_CANDIDATE'
    reason = 'saleDate foi gerada às 15:00Z, coincide com a data UTC de createdAt e difere da data civil local de createdAt.'
  } else if (createdAtLocalDate && storedDate && createdAtLocalDate !== storedDate) {
    classification = 'AMBIGUOUS'
    reason = 'A data civil da venda difere da data local de cadastro, mas não há assinatura suficiente para correção automática.'
  }

  return {
    id: String(sale._id),
    saleNumber: typeof sale.saleNumber === 'string' ? sale.saleNumber : typeof sale.number === 'string' ? sale.number : null,
    saleDate,
    createdAt: createdAt?.toISOString() ?? null,
    createdAtLocalDate,
    proposedSaleDate: classification === 'AUTO_CANDIDATE' ? createdAtLocalDate : null,
    classification,
    reason,
  }
}
