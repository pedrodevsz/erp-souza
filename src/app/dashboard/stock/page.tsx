"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { InventoryList } from '@/components/inventories/list/inventory-list'

export default function StockPage() {
  return (
    <ToastProvider>
      <InventoryList />
    </ToastProvider>
  )
}

