import type { InventoryItem, InventoryMovement, NewInventoryItem, UpdateInventoryItem } from '@/types/inventory'

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message: string
}

class InventoryApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'InventoryApiError'
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
    throw new InventoryApiError(
      payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.',
      response.status
    )
  }

  return payload.data
}

export const InventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    return request<InventoryItem[]>('/api/inventories')
  },

  async getById(id: string): Promise<InventoryItem | null> {
    return request<InventoryItem>(`/api/inventories/${id}`)
  },

  async create(data: NewInventoryItem): Promise<InventoryItem> {
    return request<InventoryItem>('/api/inventories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: UpdateInventoryItem): Promise<InventoryItem | null> {
    return request<InventoryItem>(`/api/inventories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<boolean> {
    await request<{ id: string; deleted: true }>(`/api/inventories/${id}`, {
      method: 'DELETE',
    })
    return true
  },

  async getMovements(itemId: string): Promise<InventoryMovement[]> {
    return request<InventoryMovement[]>(`/api/inventories/${itemId}/movements`)
  },

  async getRecentMovements(limit = 5): Promise<InventoryMovement[]> {
    const query = limit ? `?limit=${encodeURIComponent(String(limit))}` : ''
    return request<InventoryMovement[]>(`/api/inventories/movements${query}`)
  },

  async reserveStock(productId: string, quantity: number): Promise<InventoryItem | null> {
    const item = await this.getByProductId(productId)
    if (!item) return null

    const nextReserved = item.reservedStock + quantity
    if (nextReserved > item.currentStock) return null

    return this.update(item.id, { reservedStock: nextReserved })
  },

  async releaseReservedStock(productId: string, quantity: number): Promise<InventoryItem | null> {
    const item = await this.getByProductId(productId)
    if (!item) return null

    return this.update(item.id, { reservedStock: Math.max(0, item.reservedStock - quantity) })
  },

  async getByProductId(productId: string): Promise<InventoryItem | null> {
    const items = await this.getAll()
    return items.find((entry) => entry.productId === productId || entry.id === productId || entry.sku === productId) ?? null
  },
}

export { InventoryApiError }
