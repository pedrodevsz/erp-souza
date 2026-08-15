import type { DashboardSummary } from '@/types/dashboard'

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message: string
}

class DashboardApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'DashboardApiError'
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
    throw new DashboardApiError(
      payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.',
      response.status
    )
  }

  return payload.data
}

export const DashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    return request<DashboardSummary>('/api/dashboard/summary')
  },
}

