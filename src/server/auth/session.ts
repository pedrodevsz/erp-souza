import type { NextRequest } from 'next/server'

import type { SessionUser } from '@/types/user'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const AUTH_COOKIE_NAME = 'sis_sz_session'
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

type SessionTokenPayload = SessionUser & {
  exp: number
  iat: number
}

function getSecret() {
  return process.env.AUTH_SECRET ?? process.env.MONGODB_URI ?? 'sis-sz-auth-secret'
}

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

async function importSecretKey() {
  return crypto.subtle.importKey('raw', encoder.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

async function signPayload(payload: SessionTokenPayload) {
  const secretKey = await importSecretKey()
  const payloadBytes = encoder.encode(JSON.stringify(payload))
  const signature = await crypto.subtle.sign('HMAC', secretKey, payloadBytes)

  return `${toBase64Url(payloadBytes)}.${toBase64Url(new Uint8Array(signature))}`
}

export async function createSessionToken(user: SessionUser) {
  const now = Math.floor(Date.now() / 1000)
  return signPayload({
    ...user,
    iat: now,
    exp: now + AUTH_SESSION_MAX_AGE_SECONDS,
  })
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  const [encodedPayload, encodedSignature] = token.split('.')
  if (!encodedPayload || !encodedSignature) {
    return null
  }

  const secretKey = await importSecretKey()
  const payloadBytes = fromBase64Url(encodedPayload)
  const signatureBytes = fromBase64Url(encodedSignature)
  const isValid = await crypto.subtle.verify('HMAC', secretKey, signatureBytes, payloadBytes)

  if (!isValid) {
    return null
  }

  try {
    const payload = JSON.parse(decoder.decode(payloadBytes)) as SessionTokenPayload

    if (!payload.userId || !payload.name || !payload.role || typeof payload.exp !== 'number') {
      return null
    }

    if (payload.exp * 1000 <= Date.now()) {
      return null
    }

    return {
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
    }
  } catch {
    return null
  }
}

export async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    return null
  }

  return verifySessionToken(token)
}

export async function getSessionFromCookieValue(token?: string | null) {
  if (!token) {
    return null
  }

  return verifySessionToken(token)
}

export function createSessionCookieValue(token: string) {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
  }
}

export function createClearedSessionCookieValue() {
  return {
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  }
}
