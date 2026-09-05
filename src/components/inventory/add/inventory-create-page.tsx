"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { InventoryForm } from './inventory-form'
import { useInventoryCreatePage } from '@/hooks/inventory/useInventoryCreatePage'

function InventoryCreatePageContent() {
  const { handleSubmit } = useInventoryCreatePage()

  return (
    <div>
      <PageHeader title="Cadastrar Item" description="Cadastre um novo produto no estoque" />
      <div className="px-4 py-4 sm:px-6 lg:px-8">
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
