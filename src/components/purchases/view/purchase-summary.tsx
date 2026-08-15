"use client"

import { DefinitionList, SectionCard } from '@/components/shared'
import { formatCurrency } from '@/lib/sales'

type Props = {
    subtotal: number
    discounts: number
    freight: number
    otherExpenses: number
    total: number
}

export function PurchaseSummary({ subtotal, discounts, freight, otherExpenses, total }: Props) {
    return (
        <SectionCard title="Resumo Financeiro" description="Valores consolidados da compra e custos extras.">
            <DefinitionList
                items={[
                    { label: 'Subtotal', value: formatCurrency(subtotal) },
                    { label: 'Descontos', value: `- ${formatCurrency(discounts)}`, valueClassName: 'text-red-600', hidden: discounts <= 0 },
                    { label: 'Frete', value: formatCurrency(freight), hidden: freight <= 0 },
                    { label: 'Outras Despesas', value: formatCurrency(otherExpenses), hidden: otherExpenses <= 0 },
                    {
                        label: 'Total',
                        value: formatCurrency(total),
                        valueClassName: 'text-emerald-600 font-semibold text-base',
                    },
                ]}
            />
        </SectionCard>
    )
}
