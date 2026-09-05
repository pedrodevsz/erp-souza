import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AppError } from '@/server/errors/app-error'
import { AUTH_COOKIE_NAME, getSessionFromCookieValue } from '@/server/auth/session'
import type { UserDTO } from '@/server/models/users/users.model'
import { AuthService } from '@/server/services/auth/auth.service'

async function getCurrentUserFromCookies(): Promise<UserDTO> {
  const cookieStore = await cookies()
  const session = await getSessionFromCookieValue(cookieStore.get(AUTH_COOKIE_NAME)?.value)

  if (!session) {
    redirect('/login')
  }

  try {
    return await AuthService.me(session)
  } catch (error) {
    if (error instanceof AppError && (error.statusCode === 401 || error.statusCode === 403)) {
      redirect('/login')
    }

    throw error
  }
}

export async function requireCurrentUser() {
  return getCurrentUserFromCookies()
}

export async function requireAdminUser() {
  const currentUser = await getCurrentUserFromCookies()

  if (currentUser.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return currentUser
}
