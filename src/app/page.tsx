import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AUTH_COOKIE_NAME, getSessionFromCookieValue } from '@/server/auth/session'

export default async function Home() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookieValue(cookieStore.get(AUTH_COOKIE_NAME)?.value)
  redirect(session ? '/dashboard' : '/login')
}
