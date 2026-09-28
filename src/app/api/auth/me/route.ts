import { NextRequest } from 'next/server'

import { AppError } from '@/server/errors/app-error'
import { getSessionFromRequest } from '@/server/auth/session'
import { handleRouteError, successResponse } from '@/server/http/api-response'
import { AuthService } from '@/server/services/auth/auth.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      throw new AppError('Não autenticado.', 401)
    }

    return successResponse({ user: await AuthService.me(session) })
  } catch (error) {
    return handleRouteError(error)
  }
}
