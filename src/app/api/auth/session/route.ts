import { NextRequest } from 'next/server'

import { getSessionFromRequest } from '@/server/auth/session'
import { handleRouteError, successResponse } from '@/server/http/api-response'
import { AppError } from '@/server/errors/app-error'
import { AuthService } from '@/server/services/auth/auth.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      return successResponse({ user: null })
    }

    try {
      const user = await AuthService.me(session)
      return successResponse({ user })
    } catch (error) {
      if (error instanceof AppError && (error.statusCode === 401 || error.statusCode === 403)) {
        return successResponse({ user: null })
      }

      throw error
    }
  } catch (error) {
    return handleRouteError(error)
  }
}
