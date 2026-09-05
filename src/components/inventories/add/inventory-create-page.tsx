"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { InventoryForm } from './inventory-form'
import { useInventoryCreatePage } from '@/hooks/inventories/useInventoryCreatePage'

function InventoryCreatePageContent() {
  const { handleSubmit } = useInventoryCreatePage()

  return (
    <div>
      <PageHeader title="Cadastrar Item" description="Cadastre um novo produto no estoque" />
      <div className="p-6">
        <InventoryForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
}

export function InventoryCreatePage() {
  return (
    <ToastProvider>
      <InventoryCreatePageContent />
    </ToastProvider>
  )
}
