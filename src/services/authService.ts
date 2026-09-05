import { AuthApiError, getSession as apiGetSession, login as apiLogin, logout as apiLogout } from '@/lib/auth/auth-api'
import type { SessionUser } from '@/types/user'

function normalizeError(error: unknown) {
  if (error instanceof AuthApiError) {
    return error
  }

  if (error instanceof Error) {
    return new Error(error.message)
  }

  return new Error('Erro inesperado.')
}

export const AuthService = {
  async login(name: string, password: string): Promise<SessionUser> {
    try {
      const { user } = await apiLogin({ name, password })
      return user
    } catch (error) {
      throw normalizeError(error)
    }
  },

  async logout(): Promise<boolean> {
    try {
      await apiLogout()
      return true
    } catch (error) {
      throw normalizeError(error)
    }
  },

  async getSession(): Promise<SessionUser | null> {
    try {
      const { user } = await apiGetSession()
      return user
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) {
        return null
      }

      throw normalizeError(error)
    }
  },
}
