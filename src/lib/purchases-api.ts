import type { Purchase } from '@/types/purchases'
import type { PurchasePaymentCondition } from '@/types/purchases'
import type { PurchaseImportResponse } from '@/types/purchases-import'

export type PurchaseItemInput = {
  productId?: string
  productName: string
  brand?: string
  product?: string
  quantity: number
  unit: string
  unitPrice: number
  profitPercentage?: number
  salePrice?: number
  discount?: number
}

export type PurchaseInput = {
  supplier: string
  purchaseDate: string
  expectedDelivery?: string | null
  paymentCondition: PurchasePaymentCondition
  paymentMethod?: string | null
  invoiceNumber?: string | null
  notes?: string
  discounts?: number
  freight?: number
  otherExpenses?: number
  items: PurchaseItemInput[]
}

type ApiSuccessResponse<T> = { success: true; data: T }
type ApiErrorResponse = { success: false; message: string }

export class PurchaseApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'PurchaseApiError'
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
    throw new PurchaseApiError(payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.', response.status)
  }

  return payload.data
}

async function requestMultipart<T>(path: string, body: FormData): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    body,
  })

  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null
  if (!response.ok || !payload || payload.success === false) {
    throw new PurchaseApiError(payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.', response.status)
  }

  return payload.data
}

export async function getPurchases(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return request<Purchase[]>(`/api/purchases${query}`)
}

export async function getPurchaseById(id: string) {
  return request<Purchase>(`/api/purchases/${id}`)
}

export async function createPurchase(data: PurchaseInput) {
  return request<Purchase>('/api/purchases', { method: 'POST', body: JSON.stringify(data) })
}

export async function updatePurchase(id: string, data: Partial<PurchaseInput>) {
  return request<Purchase>(`/api/purchases/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deletePurchase(id: string) {
  await request<{ id: string; deleted: true }>(`/api/purchases/${id}`, { method: 'DELETE' })
}

export async function importPurchaseInvoice(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return requestMultipart<PurchaseImportResponse>('/api/purchases/import-invoice', formData)
}
