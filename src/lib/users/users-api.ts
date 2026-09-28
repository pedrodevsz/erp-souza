import type { UserDTO } from '@/server/models/users/users.model'

type ApiSuccessResponse<T> = { success: true; data: T }
type ApiErrorResponse = { success: false; message: string }

export class UserApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'UserApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null

  if (!response.ok || !payload || payload.success === false) {
    throw new UserApiError(
      payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.',
      response.status
    )
  }

  return payload.data
}

export const UserApi = {
  list() {
    return request<UserDTO[]>('/api/users')
  },

  create(payload: { username: string; password: string }) {
    return request<UserDTO>('/api/users', { method: 'POST', body: JSON.stringify(payload) })
  },

  update(id: string, payload: { password?: string; isActive?: boolean }) {
    return request<UserDTO>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
  },
}
