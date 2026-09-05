import { ToastProvider } from '@/components/ui/toast-provider'
import { SettingsPage } from '@/components/settings/settings-page'

export default function SettingsRoutePage() {
  return (
    <ToastProvider>
      <SettingsPage />
    </ToastProvider>
  )
}
