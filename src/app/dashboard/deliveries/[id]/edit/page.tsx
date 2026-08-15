import { ToastProvider } from '@/components/ui/toast-provider'
import { DeliveryEditPage } from '@/components/deliveries'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function DeliveryEditRoutePage({ params }: Props) {
  const { id } = await params
  return (
    <ToastProvider>
      <DeliveryEditPage id={id} />
    </ToastProvider>
  )
}

