import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, verifySessionToken } from '@/server/auth/session'

const AUTH_API_PATHS = new Set(['/api/auth/login', '/api/auth/logout', '/api/auth/session'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null

  if (pathname.startsWith('/api')) {
    if (AUTH_API_PATHS.has(pathname)) {
      return NextResponse.next()
    }

    if (!session) {
      return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 })
    }

    return NextResponse.next()
  }

  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
