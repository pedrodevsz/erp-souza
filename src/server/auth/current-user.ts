import { cookies } from 'next/headers'

import { AppError } from '@/server/errors/app-error'
import { AUTH_COOKIE_NAME, getSessionFromCookieValue } from '@/server/auth/session'
import { AuthService } from '@/server/services/auth/auth.service'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookieValue(cookieStore.get(AUTH_COOKIE_NAME)?.value)

  if (!session) {
    return null
  }

  try {
    return await AuthService.me(session)
  } catch (error) {
    if (error instanceof AppError && (error.statusCode === 401 || error.statusCode === 403)) {
      return null
    }

    throw error
  }
}

export async function requireCurrentUser() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new AppError('Acesso não autorizado.', 401)
  }

  return currentUser
}
