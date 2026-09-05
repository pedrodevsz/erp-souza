import { NextResponse } from 'next/server'

import { createClearedSessionCookieValue } from '@/server/auth/session'
import { handleRouteError } from '@/server/http/api-response'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, data: { loggedOut: true } }, { status: 200 })
    response.cookies.set(createClearedSessionCookieValue())
    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
