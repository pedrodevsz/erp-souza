"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { DeliveryList } from '@/components/deliveries'

export default function DeliveriesPage() {
  return (
    <ToastProvider>
      <DeliveryList />
    </ToastProvider>
  )
}

