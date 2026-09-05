"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { PageLoading } from '@/components/shared/page-loading'
import { CustomerForm } from './customer-form'
import { useCustomerEditPage } from '@/hooks/customers/useCustomerEditPage'

type Props = {
    id: string
}

function CustomerEditPageContent({ id }: Props) {
    const { initialValues, loading, found, handleSubmit } = useCustomerEditPage(id)

    if (loading) {
        return <PageLoading label="Carregando cliente para edição..." />
    }

    if (!found || !initialValues) {
        return <div className="rounded-2xl border bg-white p-6 text-slate-500">Cliente não encontrado.</div>
    }

    const hasDocument = Boolean(initialValues.document?.trim())
    const hasAddresses = Boolean(initialValues.addresses?.length)

    return (
        <div>
            <PageHeader title="Editar Cliente" description="Edite os dados do cliente" />
            <div className="px-4 py-4 sm:px-6 lg:px-8">
                {!hasDocument || !hasAddresses ? (
                    <div className="mb-4 rounded-2xl border border-dashed border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                        {[
                            !hasDocument ? 'Este cliente está sem documento cadastrado.' : null,
                            !hasAddresses ? 'Nenhum endereço foi informado ainda.' : null,
                        ]
                            .filter(Boolean)
                            .join(' ')}{' '}
                        Você pode completar isso agora ou deixar em branco.
                    </div>
                ) : null}

                <CustomerForm
                    initialValues={initialValues}
                    submitLabel="Atualizar Cliente"
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    )
}

export function CustomerEditPage({ id }: Props) {
    return (
        <ToastProvider>
            <CustomerEditPageContent id={id} />
        </ToastProvider>
    )
}
