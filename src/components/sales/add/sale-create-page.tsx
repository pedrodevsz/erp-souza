"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { SaleForm } from './sale-form'
import { SaleCompletedDialog } from './sale-completed-dialog'
import { useSaleCreatePage } from '@/hooks/sales/useSaleCreatePage'

function SaleCreatePageContent() {
  const { handleSubmit, completedSale, saleResultModalOpen, formResetKey, setSaleResultModalOpen } = useSaleCreatePage()

  return (
    <div>
      <PageHeader title="Nova Venda" description="Selecione o cliente, adicione os produtos e finalize a venda." />
      <div className="p-6">
        <SaleForm key={formResetKey} onSubmit={handleSubmit} />
      </div>
      <SaleCompletedDialog
        open={saleResultModalOpen}
        onOpenChange={setSaleResultModalOpen}
        sale={completedSale}
      />
    </div>
  )
}

export function SaleCreatePage() {
  return (
    <ToastProvider>
      <SaleCreatePageContent />
    </ToastProvider>
  )
}
