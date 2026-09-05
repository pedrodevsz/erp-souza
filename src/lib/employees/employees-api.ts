import type { EmployeeRole } from '@/lib/employees/employee-roles'

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message: string
}

class EmployeeApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'EmployeeApiError'
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
    throw new EmployeeApiError(
      payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.',
      response.status
    )
  }

  return payload.data
}

export const EmployeeApi = {
  async getAll() {
    return request<Array<{ id: string; name: string; role: string; phone?: string; active: boolean; createdAt: string; updatedAt: string }>>('/api/employees')
  },

  async getById(id: string) {
    return request<{ id: string; name: string; role: string; phone?: string; active: boolean; createdAt: string; updatedAt: string }>(`/api/employees/${id}`)
  },

  async create(payload: { name: string; role: EmployeeRole; phone?: string; active?: boolean }) {
    return request<{ id: string; name: string; role: string; phone?: string; active: boolean; createdAt: string; updatedAt: string }>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async update(id: string, payload: { name?: string; role?: EmployeeRole; phone?: string; active?: boolean }) {
    return request<{ id: string; name: string; role: string; phone?: string; active: boolean; createdAt: string; updatedAt: string }>(`/api/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  async delete(id: string) {
    await request<{ id: string; deleted: true }>(`/api/employees/${id}`, {
      method: 'DELETE',
    })
  },

  async toggleStatus(id: string) {
    return request<{ id: string; name: string; role: string; phone?: string; active: boolean; createdAt: string; updatedAt: string }>(
      `/api/employees/${id}/toggle-status`,
      {
        method: 'PATCH',
      }
    )
  },
}

export { EmployeeApiError }
