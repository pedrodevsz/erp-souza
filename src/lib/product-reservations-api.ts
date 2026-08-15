import type { NewProductReservation, ProductReservation } from '@/types/product-reservation'

type ApiSuccessResponse<T> = { success: true; data: T }
type ApiErrorResponse = { success: false; message: string }

export class ProductReservationApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ProductReservationApiError'
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
    throw new ProductReservationApiError(
      payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.',
      response.status
    )
  }

  return payload.data
}

export async function createProductReservation(data: NewProductReservation) {
  return request<ProductReservation>('/api/product-reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
