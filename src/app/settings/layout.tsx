import { AppShell } from '@/features/layout/app-shell'
import { requireAdminUser } from '@/server/auth/guards'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await requireAdminUser()

  return <AppShell currentUser={currentUser}>{children}</AppShell>
}
