import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/server/errors/app-error'
import { createSessionCookieValue, createSessionToken, getSessionFromRequest } from '@/server/auth/session'
import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { AuthService } from '@/server/services/auth/auth.service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const existingSession = await getSessionFromRequest(request)
    if (existingSession) {
      try {
        const currentUser = await AuthService.me(existingSession)
        return successResponse({ user: currentUser })
      } catch (error) {
        if (!(error instanceof AppError && (error.statusCode === 401 || error.statusCode === 403))) {
          throw error
        }
      }
    }

    const body = await readJsonBody(request)
    const user = await AuthService.login(body)
    const token = await createSessionToken({
      userId: user.id,
      name: user.name,
      role: user.role,
    })

    const response = NextResponse.json({ success: true, data: { user } }, { status: 200 })
    response.cookies.set(createSessionCookieValue(token))
    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
