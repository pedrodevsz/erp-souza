"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { PageLoading } from '@/components/shared/page-loading'
import { InventoryForm } from './inventory-form'
import { useInventoryEditPage } from '@/hooks/inventories/useInventoryEditPage'

type Props = {
  id: string
}

function InventoryEditPageContent({ id }: Props) {
  const { item, initialValues, loading, handleSubmit } = useInventoryEditPage(id)

  if (loading) {
    return <PageLoading label="Carregando item para edição..." />
  }

  if (!item || !initialValues) {
    return <div className="rounded-2xl border bg-white p-6 text-slate-500">Item não encontrado.</div>
  }

  return (
    <div>
      <PageHeader title="Editar Item" description="Edite os dados do estoque" />
      <div className="p-6">
        <InventoryForm
          initialValues={initialValues}
          submitLabel="Atualizar Item"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}

export function InventoryEditPage({ id }: Props) {
  return (
    <ToastProvider>
      <InventoryEditPageContent id={id} />
    </ToastProvider>
  )
}
