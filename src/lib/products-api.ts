import type { Product } from '@/types/product'
import type { ProductInput } from '@/lib/products'

type ApiSuccessResponse<T> = { success: true; data: T }
type ApiErrorResponse = { success: false; message: string }

export class ProductApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ProductApiError'
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
    throw new ProductApiError(payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.', response.status)
  }

  return payload.data
}

export async function getProducts(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return request<Product[]>(`/api/products${query}`)
}

export async function createProduct(data: ProductInput) {
  return request<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  return request<Product>(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteProduct(id: string) {
  await request<{ id: string; deleted: true }>(`/api/products/${id}`, { method: 'DELETE' })
}
