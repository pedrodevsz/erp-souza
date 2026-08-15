"use client"

import { useEffect } from 'react'
import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { PurchaseForm } from './purchase-form'
import { usePurchaseCreatePage } from '@/hooks/purchases/usePurchaseCreatePage'
import { usePurchaseImportStore } from '@/stores/purchases/usePurchaseImportStore'
import { summarizePurchaseImportPayload } from '@/lib/purchase-import-extraction'

function PurchaseCreatePageContent() {
    const { handleSubmit } = usePurchaseCreatePage()
    const importedPurchase = usePurchaseImportStore((state) => state.importedPurchase)
    const clearImportResult = usePurchaseImportStore((state) => state.clearImportResult)

    useEffect(() => {
        if (importedPurchase) {
            if (process.env.NODE_ENV !== 'production') {
                console.info('[import-invoice] form-default-values', summarizePurchaseImportPayload(importedPurchase))
            }
            queueMicrotask(() => clearImportResult())
        }
    }, [clearImportResult, importedPurchase])

    return (
        <div>
            <PageHeader title="Nova Compra" description="Cadastre uma nova compra de produtos" />
            <div className="p-6">
                <PurchaseForm initialValues={importedPurchase ?? undefined} onSubmit={handleSubmit} />
            </div>
        </div>
    )
}

export function PurchaseCreatePage() {
    return (
        <ToastProvider>
            <PurchaseCreatePageContent />
        </ToastProvider>
    )
}
