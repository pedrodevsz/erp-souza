"use client"

import { PurchaseItem } from '@/types/purchases'
import { DataTableSection } from '@/components/shared'
import { EmptyStateAction } from '@/components/shared'
import { getPurchaseCategoryChipClassName, getPurchaseCategoryLabel, getPurchaseUnitChipClassName, getPurchaseUnitLabel } from '@/lib/purchases'

type Props = {
    items: PurchaseItem[]
    purchaseId: string
}

export function PurchaseItemsTable({ items, purchaseId }: Props) {
    return (
        <DataTableSection
            title="Itens da Compra"
            columns={[
                { header: 'Produto' },
                { header: 'Categoria' },
                { header: 'Quantidade', className: 'text-right' },
                { header: 'Unidade', className: 'text-right' },
                { header: 'Preço Unitário', className: 'text-right' },
                { header: 'Lucro %', className: 'text-right' },
                { header: 'Desconto', className: 'text-right' },
                { header: 'Subtotal', className: 'text-right' },
            ]}
            rowCount={items.length}
            colSpan={8}
            emptyContent={
                <EmptyStateAction
                    title="Sem itens"
                    description="Edite a compra para incluir itens."
                    actionLabel="Editar compra"
                    href={`/dashboard/purchases/${purchaseId}/edit`}
                />
            }
        >
            {items.map((item) => (
                <tr key={item.id}>
                    <td className="p-2 align-middle font-medium">{item.productName}</td>
                    <td className="p-2 align-middle">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPurchaseCategoryChipClassName(item.category, false)}`}>
                            {getPurchaseCategoryLabel(item.category)}
                        </span>
                    </td>
                    <td className="p-2 align-middle text-right">{item.quantity}</td>
                    <td className="p-2 align-middle text-right">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPurchaseUnitChipClassName(item.unit, false)}`}>
                            {getPurchaseUnitLabel(item.unit)}
                        </span>
                    </td>
                    <td className="p-2 align-middle text-right">R$ {item.unitPrice.toFixed(2)}</td>
                    <td className="p-2 align-middle text-right">{item.profitPercentage.toFixed(2)}%</td>
                    <td className="p-2 align-middle text-right">R$ {item.discount.toFixed(2)}</td>
                    <td className="p-2 align-middle text-right font-medium">R$ {item.subtotal.toFixed(2)}</td>
                </tr>
            ))}
        </DataTableSection>
    )
}
