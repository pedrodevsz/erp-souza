import type { Delivery, DeliveryFilters, UpdateDelivery } from '@/types/delivery'

type DeliveryQuery = Partial<Pick<DeliveryFilters, 'dateFrom' | 'dateTo'>> & {
  search?: string
}

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message: string
}

export class DeliveryApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'DeliveryApiError'
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
    throw new DeliveryApiError(
      payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.',
      response.status
    )
  }

  return payload.data
}

export function buildDeliveryQuery(params?: DeliveryQuery) {
  const searchParams = new URLSearchParams()

  if (params?.search) searchParams.set('search', params.search)
  if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom)
  if (params?.dateTo) searchParams.set('dateTo', params.dateTo)

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const DeliveryService = {
  async getAll(query?: DeliveryQuery): Promise<Delivery[]> {
    return request<Delivery[]>(`/api/deliveries${buildDeliveryQuery(query)}`)
  },

  async getById(id: string): Promise<Delivery> {
    return request<Delivery>(`/api/deliveries/${id}`)
  },

  async update(id: string, data: UpdateDelivery): Promise<Delivery> {
    return request<Delivery>(`/api/deliveries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async markItemAsDelivered(deliveryId: string, itemId: string): Promise<Delivery> {
    return request<Delivery>(`/api/deliveries/${deliveryId}/items/${itemId}/delivered`, { method: 'PATCH' })
  },

  async markItemAsPending(deliveryId: string, itemId: string): Promise<Delivery> {
    return request<Delivery>(`/api/deliveries/${deliveryId}/items/${itemId}/pending`, { method: 'PATCH' })
  },

  async completeDelivery(id: string): Promise<Delivery> {
    return request<Delivery>(`/api/deliveries/${id}/complete`, { method: 'PATCH' })
  },

  async cancelDelivery(id: string): Promise<Delivery> {
    return request<Delivery>(`/api/deliveries/${id}/cancel`, { method: 'PATCH' })
  },
}

