import type { SessionUser } from '@/types/user'

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message: string
}

export class AuthApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthApiError'
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
    throw new AuthApiError(
      payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.',
      response.status
    )
  }

  return payload.data
}

export type LoginInput = {
  name: string
  password: string
}

export async function login(data: LoginInput) {
  return request<{ user: SessionUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function logout() {
  return request<{ loggedOut: true }>('/api/auth/logout', {
    method: 'POST',
  })
}

export async function getSession() {
  return request<{ user: SessionUser | null }>('/api/auth/session')
}
