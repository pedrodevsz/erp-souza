"use client"

import { Badge } from '@/components/ui'
import { DefinitionList, SectionCard } from '@/components/shared'
import type { PurchasePaymentCondition } from '@/types/purchases'
import { getPurchasePaymentConditionValues } from '@/lib/purchases'

type Props = {
    invoiceNumber?: string | null
    supplier: string
    purchaseDate: string
    paymentMethod?: string | null
    paymentCondition: PurchasePaymentCondition
}

export function PurchaseHeader({ invoiceNumber, supplier, purchaseDate, paymentMethod, paymentCondition }: Props) {
    const paymentConditions = getPurchasePaymentConditionValues(paymentCondition)
    const paymentConditionLabel =
        paymentConditions.length === 1 ? '1 condição informada' : `${paymentConditions.length} condições informadas`

    return (
        <SectionCard title="Informações da Compra" description="Dados principais e informações de pagamento registradas na compra.">
            <DefinitionList
                columns={2}
                items={[
                    { label: 'Fornecedor', value: supplier },
                    { label: 'Data', value: purchaseDate.slice(0, 10) },
                    { label: 'Número da NF', value: invoiceNumber, hidden: !invoiceNumber?.trim() },
                    {
                        label: 'Condição de Pagamento',
                        value: (
                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="neutral">{paymentConditionLabel}</Badge>
                                    <Badge variant="neutral">{paymentConditions.length} total</Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    {paymentConditions.map((condition, index) => (
                                        <div key={`${condition}-${index}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                                Condição {index + 1}
                                            </div>
                                            <div className="mt-1 text-sm font-medium text-slate-800">{condition}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ),
                        hidden: paymentConditions.length === 0,
                    },
                    {
                        label: 'Forma de Pagamento',
                        value: <Badge variant="neutral">{paymentMethod}</Badge>,
                        hidden: !paymentMethod?.trim(),
                    },
                ]}
            />
        </SectionCard>
    )
}
