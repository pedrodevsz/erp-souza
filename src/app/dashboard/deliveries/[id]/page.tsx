import { ToastProvider } from '@/components/ui/toast-provider'
import { DeliveryViewPage } from '@/components/deliveries'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function DeliveryViewRoutePage({ params }: Props) {
  const { id } = await params
  return (
    <ToastProvider>
      <DeliveryViewPage id={id} />
    </ToastProvider>
  )
}

