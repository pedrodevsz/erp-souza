import type {
  SaleDeliveryStatus,
  SaleInstallment,
  SaleInstallmentStatus,
  SaleItem,
  SalePayment,
  SalePaymentStatus,
  SalePaymentCondition,
  SalePaymentConditionType,
  SaleStatus,
} from '@/types/sale'

export const SALE_PAYMENT_METHODS = ['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto']

export const SALE_PAYMENT_CONDITION_OPTIONS: Array<{ value: SalePaymentConditionType; label: string }> = [
  { value: 'A_VISTA', label: 'À vista' },
  { value: 'PARCELADO', label: 'Parcelado' },
  { value: 'FIADO', label: 'Fiado' },
  { value: 'PRAZO', label: 'Prazo' },
]

export const SALE_PAYMENT_CONDITIONS = SALE_PAYMENT_CONDITION_OPTIONS.map((option) => option.label)

export const SALE_INSTALLMENT_STATUSES: Record<SaleInstallmentStatus, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
}

export const SALE_PAYMENT_STATUS_LABELS: Record<SalePaymentStatus, string> = {
  PENDING: 'Pendente',
  PARTIAL: 'Parcial',
  PAID: 'Pago',
}

export const SALE_PAYMENT_STATUS_VARIANTS: Record<SalePaymentStatus, string> = {
  PENDING: 'neutral',
  PARTIAL: 'warning',
  PAID: 'success',
}

export const SALE_QUANTITY_STEP = 0.5

export const SALE_DELIVERY_STATUS_LABELS: Record<SaleDeliveryStatus, string> = {
  PENDING: 'Pendente',
  DELIVERED: 'Entregue',
}

export const SALE_DELIVERY_STATUS_VARIANTS: Record<SaleDeliveryStatus, string> = {
  PENDING: 'warning',
  DELIVERED: 'success',
}

export const SALE_STATUS_LABELS = SALE_DELIVERY_STATUS_LABELS
export const SALE_STATUS_VARIANTS = SALE_DELIVERY_STATUS_VARIANTS

export function normalizeSalePaymentConditionType(value: string | null | undefined): SalePaymentConditionType {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'A_VISTA' || normalized === 'À_VISTA' || normalized === 'A VISTA' || normalized === 'AVISTA' || normalized === 'A VISTA') {
    return 'A_VISTA'
  }
  if (normalized === 'PARCELADO') return 'PARCELADO'
  if (normalized === 'FIADO') return 'FIADO'
  if (normalized === 'PRAZO') return 'PRAZO'
  if (normalized?.includes('VISTA')) return 'A_VISTA'
  if (normalized?.includes('FIADO')) return 'FIADO'
  if (normalized?.includes('PRAZO')) return 'PRAZO'
  if (normalized?.includes('PARCEL')) return 'PARCELADO'
  if (normalized?.includes('VEZES')) return 'PARCELADO'
  return 'A_VISTA'
}

export function isImmediateSalePaymentCondition(paymentCondition: SalePaymentCondition | SalePaymentConditionType | string) {
  if (typeof paymentCondition === 'string' && !paymentCondition.trim()) {
    return false
  }

  const type = typeof paymentCondition === 'string' ? normalizeSalePaymentConditionType(paymentCondition) : paymentCondition.type
  return type === 'A_VISTA'
}

export function isInstallmentSalePaymentCondition(paymentCondition: SalePaymentCondition | SalePaymentConditionType | string) {
  return !isImmediateSalePaymentCondition(paymentCondition)
}

export function isFiadoPaymentCondition(paymentCondition: SalePaymentCondition | SalePaymentConditionType | string) {
  if (typeof paymentCondition === 'string' && !paymentCondition.trim()) {
    return false
  }

  const type = typeof paymentCondition === 'string' ? normalizeSalePaymentConditionType(paymentCondition) : paymentCondition.type
  return type === 'FIADO'
}

export function getSalePaymentConditionLabel(paymentCondition: SalePaymentCondition | SalePaymentConditionType | string) {
  if (typeof paymentCondition === 'string' && !paymentCondition.trim()) {
    return 'Não definida'
  }

  const type = typeof paymentCondition === 'string' ? normalizeSalePaymentConditionType(paymentCondition) : paymentCondition.type
  return SALE_PAYMENT_CONDITION_OPTIONS.find((option) => option.value === type)?.label ?? 'À vista'
}

export function getSalePaymentConditionVariant(paymentCondition: SalePaymentCondition | SalePaymentConditionType | string) {
  return isInstallmentSalePaymentCondition(paymentCondition) ? 'warning' : 'neutral'
}

export function getSalePaymentMethodLabel(
  paymentCondition: SalePaymentCondition | SalePaymentConditionType | string,
  paymentMethod: string,
  payments: Array<Pick<SalePayment, 'paymentMethod'>> = []
) {
  if (isImmediateSalePaymentCondition(paymentCondition)) {
    return paymentMethod || 'Não informado'
  }

  const methods = payments.map((payment) => payment.paymentMethod.trim()).filter(Boolean)
  if (methods.length > 0) {
    const uniqueMethods = Array.from(new Set(methods))
    return uniqueMethods.length === 1 ? uniqueMethods[0] : 'Múltiplas formas'
  }

  return paymentMethod || 'Sem pagamentos'
}

export function getSalePaymentInstallmentSummary(
  paymentCondition: SalePaymentCondition | SalePaymentConditionType | string,
  installments: Array<Pick<SaleInstallment, 'amount'>>
) {
  if (isImmediateSalePaymentCondition(paymentCondition)) {
    return 'Pagamento único'
  }

  if (installments.length === 0) {
    return 'Sem AVs informados'
  }

  return `${installments.length} AV${installments.length === 1 ? '' : 's'}`
}

export function normalizeSalePaymentStatus(value: string | null | undefined): SalePaymentStatus {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'PAID' || normalized === 'PAGO') return 'PAID'
  if (normalized === 'PARTIAL' || normalized === 'PARCIAL') return 'PARTIAL'
  return 'PENDING'
}

export function normalizeSalePayment(payment: Partial<SalePayment> & { amount?: number; date?: string; paymentMethod?: string; notes?: string }, index = 1) {
  return {
    id: payment.id?.trim() || `payment-${index}`,
    amount: roundCurrency(Number.isFinite(payment.amount) ? Number(payment.amount) : 0),
    date: payment.date?.trim() || new Date().toISOString(),
    paymentMethod: payment.paymentMethod?.trim() ?? '',
    notes: payment.notes?.trim() || undefined,
  }
}

export function normalizeSaleInstallmentStatus(value: string | null | undefined): SaleInstallmentStatus {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'PAGO') return 'PAGO'
  return 'PENDENTE'
}

export function normalizeSaleInstallment(installment: Partial<SaleInstallment> & { number?: number; amount?: number; paymentMethod?: string; dueDate?: string }) {
  return {
    id: installment.id ?? '',
    number: Number.isFinite(installment.number) ? Number(installment.number) : 1,
    amount: roundCurrency(Number.isFinite(installment.amount) ? Number(installment.amount) : 0),
    paymentMethod: installment.paymentMethod?.trim() ?? '',
    dueDate: installment.dueDate?.trim() || undefined,
    status: normalizeSaleInstallmentStatus(installment.status),
  }
}

export function normalizeSalePaymentCondition(
  paymentCondition:
    | string
    | SalePaymentCondition
    | {
        type?: string
        installments?: Array<Partial<SaleInstallment> & { number?: number; amount?: number; paymentMethod?: string; dueDate?: string }>
      }
    | null
    | undefined
): SalePaymentCondition {
  if (!paymentCondition || typeof paymentCondition === 'string') {
    const type = normalizeSalePaymentConditionType(paymentCondition)
    return { type, installments: [] }
  }

  const type = normalizeSalePaymentConditionType(paymentCondition.type)
  const installments = Array.isArray(paymentCondition.installments)
    ? paymentCondition.installments.map((installment, index) => ({
        id: installment.id?.trim() || `installment-${index + 1}`,
        number: Number.isFinite(installment.number) ? Number(installment.number) : index + 1,
        amount: roundCurrency(Number.isFinite(installment.amount) ? Number(installment.amount) : 0),
        paymentMethod: installment.paymentMethod?.trim() ?? '',
        dueDate: installment.dueDate?.trim() || undefined,
        status: normalizeSaleInstallmentStatus(installment.status),
      }))
    : []

  if (type === 'A_VISTA') {
    return { type, installments: [] }
  }

  return { type, installments }
}

export function normalizeSalePayments(
  payments:
    | Array<
        Partial<SalePayment> & {
          amount?: number
          date?: string
          paymentMethod?: string
          notes?: string
        }
      >
    | undefined,
  fallback: {
    paymentCondition?: SalePaymentCondition | string | null
    paymentMethod?: string
    initialPayment?: number
    saleDate?: string
    total: number
  }
) {
  const normalizedPayments = Array.isArray(payments)
    ? payments.map((payment, index) => normalizeSalePayment(payment, index + 1))
    : []

  if (normalizedPayments.length > 0) {
    return normalizedPayments
  }

  const paymentConditionType = typeof fallback.paymentCondition === 'string' ? normalizeSalePaymentConditionType(fallback.paymentCondition) : fallback.paymentCondition?.type

  if (paymentConditionType === 'A_VISTA') {
    return [
      normalizeSalePayment(
        {
          amount: fallback.total,
          date: fallback.saleDate ?? new Date().toISOString(),
          paymentMethod: fallback.paymentMethod ?? '',
        },
        1
      ),
    ]
  }

  if (Number.isFinite(fallback.initialPayment ?? NaN) && (fallback.initialPayment ?? 0) > 0) {
    return [
      normalizeSalePayment(
        {
          amount: fallback.initialPayment,
          date: fallback.saleDate ?? new Date().toISOString(),
          paymentMethod: fallback.paymentMethod ?? '',
        },
        1
      ),
    ]
  }

  return []
}

export function getSalePaidAmount(
  sale:
    | { payments?: Array<Pick<SalePayment, 'amount'>>; paymentCondition?: SalePaymentCondition; total?: number }
    | { paymentCondition?: SalePaymentCondition; total?: number }
) {
  const payments = 'payments' in sale ? sale.payments ?? [] : []
  if (payments.length > 0) {
    return roundCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))
  }

  const installments = sale.paymentCondition?.installments ?? []
  return roundCurrency(
    installments
      .filter((installment) => installment.status === 'PAGO')
      .reduce((sum, installment) => sum + installment.amount, 0)
  )
}

export function getSaleRemainingAmount(total: number, paidAmount: number) {
  return roundCurrency(Math.max(0, total - paidAmount))
}

export function getSalePaymentStatus(total: number, paidAmount: number): SalePaymentStatus {
  if (paidAmount <= 0) return 'PENDING'
  if (roundCurrency(paidAmount) >= roundCurrency(total)) return 'PAID'
  return 'PARTIAL'
}

export function sumSaleInstallments(installments: Array<Pick<SaleInstallment, 'amount'>>) {
  return roundCurrency(installments.reduce((sum, installment) => sum + installment.amount, 0))
}

export function buildSaleInstallmentDrafts(total: number, count = 2, paymentMethod = ''): Array<Omit<SaleInstallment, 'id'>> {
  if (count <= 0) return []

  const normalizedTotal = roundCurrency(total)
  const baseAmount = count > 0 ? roundCurrency(normalizedTotal / count) : 0
  const drafts = Array.from({ length: count }).map((_, index) => ({
    number: index + 1,
    amount: index === count - 1 ? roundCurrency(normalizedTotal - baseAmount * (count - 1)) : baseAmount,
    paymentMethod,
    dueDate: undefined,
    status: 'PENDENTE' as const,
  }))

  return drafts
}

export function buildSaleInstallmentId(saleId: string, number: number) {
  return `${saleId}-installment-${number}`
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

export function roundSaleQuantity(value: number) {
  return Math.round(value * 2) / 2
}

export function calculateSaleItemSubtotal(quantity: number, unitPrice: number, discount: number) {
  return roundCurrency(quantity * unitPrice - discount)
}

export function calculateSaleSubtotal(items: SaleItem[]) {
  return roundCurrency(items.reduce((sum, item) => sum + item.subtotal, 0))
}

export function calculateSaleDiscount(items: SaleItem[], discount = 0) {
  return roundCurrency(discount)
}

export function calculateSaleTotal(subtotal: number, discount: number, shipping: number, otherCosts: number) {
  return roundCurrency(subtotal - discount + shipping + otherCosts)
}

export function calculateChange(received: number, total: number) {
  return roundCurrency(received - total)
}

export function createSaleReference(id: string) {
  const digits = id.match(/\d+/g)?.join('')
  if (digits) {
    return `VEN-${digits.padStart(4, '0')}`
  }

  return `VEN-${id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`
}

export function getSaleDeliveryStatus(isDelivery: boolean): SaleDeliveryStatus {
  return isDelivery ? 'PENDING' : 'DELIVERED'
}

export function getSaleDeliveryFlagLabel(isDelivery: boolean) {
  return isDelivery ? 'Entrega' : 'Retirada'
}

export function getSaleDeliveryFlagVariant(isDelivery: boolean) {
  return isDelivery ? 'warning' : 'neutral'
}

export function normalizeSaleDeliveryStatus(value: string | null | undefined): SaleDeliveryStatus {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'PENDING' || normalized === 'DELIVERED') return normalized
  if (normalized === 'ENTREGAR') return 'PENDING'
  if (normalized === 'ENTREGUE' || normalized === 'CONFIRMED') return 'DELIVERED'
  return 'DELIVERED'
}

export function normalizeSaleDeliveryFlag(
  value: boolean | null | undefined,
  legacyStatus?: string | null | undefined
): boolean {
  if (typeof value === 'boolean') return value
  return normalizeSaleDeliveryStatus(legacyStatus) === 'PENDING'
}

export function saleStatusFromString(value: string): SaleStatus {
  return normalizeSaleDeliveryStatus(value)
}
