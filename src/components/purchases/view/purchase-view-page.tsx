"use client"

import { PageHeader } from '@/components/page-header'
import { PageLoading } from '@/components/shared/page-loading'
import { usePurchaseViewPage } from '@/hooks/purchases/usePurchaseViewPage'
import { PurchaseHeader } from './purchase-header'
import { PurchaseItemsTable } from './purchase-items-table'
import { PurchaseSummary } from './purchase-summary'
import { PurchaseActions } from './purchase-actions'

type Props = {
    id: string
}

export function PurchaseViewPage({ id }: Props) {
    const { purchase, loading } = usePurchaseViewPage(id)

    if (loading) return <PageLoading label="Carregando compra..." />
    if (!purchase) return <div className="rounded-2xl border bg-white p-6 text-slate-500">Compra não encontrada.</div>

    return (
        <div>
            <PageHeader title={`Compra ${purchase.invoiceNumber ?? purchase.id}`} description="Visualização da compra" />
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <PurchaseHeader
                            invoiceNumber={purchase.invoiceNumber}
                            supplier={purchase.supplier}
                            purchaseDate={purchase.purchaseDate}
                            paymentMethod={purchase.paymentMethod}
                            paymentCondition={purchase.paymentCondition}
                        />
                    </div>
                    <PurchaseSummary
                        subtotal={purchase.subtotal}
                        discounts={purchase.discounts}
                        freight={purchase.freight}
                        otherExpenses={purchase.otherExpenses}
                        total={purchase.total}
                    />
                </div>

                <PurchaseItemsTable items={purchase.items} purchaseId={id} />

                <PurchaseActions purchaseId={id} />
            </div>
        </div>
    )
}
