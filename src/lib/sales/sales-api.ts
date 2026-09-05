import type { SaleDeliveryStatus, SaleInstallmentStatus, SalePaymentConditionType, SalePaymentStatus } from '@/types/sale'

export type SaleItemInput = {
  productId: string
  productName: string
  sku: string
  unit: string
  quantity: number
  availableStock: number
  unitPrice: number
  discount?: number
}

export type SaleInstallmentInput = {
  id?: string
  number: number
  amount: number
  paymentMethod: string
  dueDate?: string
  status?: SaleInstallmentStatus
}

export type SalePaymentConditionInput = {
  type: SalePaymentConditionType
  installments?: SaleInstallmentInput[]
}

export type SalePaymentInput = {
  id?: string
  amount: number
  date: string
  paymentMethod?: string
  notes?: string
}

export type SaleInput = {
  customerId: string
  customerName: string
  sellerId: string
  sellerName: string
  saleDate: string
  isDelivery: boolean
  deliveryDate?: string
  paymentMethod: string
  paymentCondition: SalePaymentConditionInput
  payments?: SalePaymentInput[]
  initialPayment?: number
  notes?: string
  discount?: number
  shipping?: number
  otherCosts?: number
  items: SaleItemInput[]
}

export type SaleHistoryEntry = {
  id: string
  saleId: string
  action: 'created' | 'updated' | 'delivered' | 'cancelled'
  description: string
  user: string
  date: string
}

export type Sale = SaleInput & {
  id: string
  deliveryStatus: SaleDeliveryStatus
  paymentStatus: SalePaymentStatus
  paidAmount: number
  remainingAmount: number
  subtotal: number
  total: number
  items: Array<SaleItemInput & { id: string; subtotal: number }>
  createdAt: string
  updatedAt: string
}

type ApiSuccessResponse<T> = { success: true; data: T }
type ApiErrorResponse = { success: false; message: string }

export class SalesApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SalesApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null
  if (!response.ok || !payload || payload.success === false) {
    throw new SalesApiError(
      payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.',
      response.status
    )
  }

  return payload.data
}

export async function getSales(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return request<Sale[]>(`/api/sales${query}`)
}

export async function getSaleById(id: string) {
  return request<Sale>(`/api/sales/${id}`)
}

export async function createSale(data: SaleInput) {
  return request<Sale>('/api/sales', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateSale(id: string, data: Partial<SaleInput>) {
  return request<Sale>(`/api/sales/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function addSalePayment(id: string, data: SalePaymentInput) {
  return request<Sale>(`/api/sales/${id}/payments`, { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteSale(id: string) {
  await request<{ id: string; deleted: true }>(`/api/sales/${id}`, { method: 'DELETE' })
}

export async function getSaleHistory(id: string) {
  return request<SaleHistoryEntry[]>(`/api/sales/${id}/history`)
}

export async function cancelSale(id: string) {
  return request<Sale>(`/api/sales/${id}/cancel`, { method: 'POST' })
}
