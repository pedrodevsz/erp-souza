"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { PageLoading } from '@/components/shared/page-loading'
import { SaleForm } from './sale-form'
import { useSaleEditPage } from '@/hooks/sales/useSaleEditPage'

type Props = {
  id: string
}

function SaleEditPageContent({ id }: Props) {
  const { sale, loading, handleSubmit } = useSaleEditPage(id)

  if (loading) {
    return <PageLoading label="Carregando venda para edição..." />
  }

  if (!sale) {
    return <div className="rounded-2xl border bg-white p-6 text-slate-500">Venda não encontrada.</div>
  }

  return (
    <div>
      <PageHeader title="Editar Venda" description="Edite os dados da venda antes da confirmação." />
      <div className="p-6">
        <SaleForm
          initialValues={sale}
          submitLabel="Atualizar Venda"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}

export function SaleEditPage({ id }: Props) {
  return (
    <ToastProvider>
      <SaleEditPageContent id={id} />
    </ToastProvider>
  )
}
