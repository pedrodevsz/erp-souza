"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { SalesList } from '@/components/sales/list'

export default function SalesPage() {
  return (
    <ToastProvider>
      <SalesList />
    </ToastProvider>
  )
}
