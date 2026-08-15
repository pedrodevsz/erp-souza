"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { CustomerForm } from './customer-form'
import { useCustomerCreatePage } from '@/hooks/customers/useCustomerCreatePage'

function CustomerCreatePageContent() {
    const { handleSubmit } = useCustomerCreatePage()

    return (
        <div>
            <PageHeader title="Cadastrar Cliente" description="Cadastre um novo cliente no sistema." />
            <div className="px-4 py-4 sm:px-6 lg:px-8">
                <CustomerForm onSubmit={handleSubmit} />
            </div>
        </div>
    )
}

export function CustomerCreatePage() {
    return (
        <ToastProvider>
            <CustomerCreatePageContent />
        </ToastProvider>
    )
}
