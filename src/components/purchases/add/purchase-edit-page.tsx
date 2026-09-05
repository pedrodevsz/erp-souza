"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { PageLoading } from '@/components/shared/page-loading'
import { PurchaseForm } from './purchase-form'
import { usePurchaseEditPage } from '@/hooks/purchases/usePurchaseEditPage'

type Props = {
    id: string
}

function PurchaseEditPageContent({ id }: Props) {
    const { purchase, initialValues, loading, handleSubmit } = usePurchaseEditPage(id)

    if (loading) {
        return <PageLoading label="Carregando compra para edição..." />
    }

    if (!purchase || !initialValues) {
        return <div className="rounded-2xl border bg-white p-6 text-slate-500">Compra não encontrada.</div>
    }

    return (
        <div>
            <PageHeader title="Editar Compra" description="Edite os dados da compra" />
            <div className="p-6">
                <PurchaseForm
                    initialValues={initialValues}
                    submitLabel="Atualizar Compra"
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    )
}

export function PurchaseEditPage({ id }: Props) {
    return (
        <ToastProvider>
            <PurchaseEditPageContent id={id} />
        </ToastProvider>
    )
}
