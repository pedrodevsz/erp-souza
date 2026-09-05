"use client"

import { Button } from '@/components/ui'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { useState } from 'react'
import { usePurchases } from '@/hooks/purchases/usePurchases'
import { useRouter } from 'next/navigation'
import { NewSupplierModal } from '@/components/suppliers/new-supplier-modal'
import { useSupplierStore } from '@/stores/useSupplierStore'
import { DataTableSection, EmptyStateAction } from '@/components/shared'
import { PurchaseSummaryCards } from './purchase-summary-cards'
import { PurchaseFiltersCard } from './purchase-filters-card'
import { purchaseMessages, getFeedbackErrorMessage } from '@/lib/messages/feedback'
import { usePurchaseStore } from '@/stores/purchases/usePurchaseStore'
import { getPurchaseCategoryChipClassName, getPurchaseCategoryLabel } from '@/lib/purchases'
import { NewPurchaseMethodModal } from '@/components/purchases/new-purchase-method-modal'

export function PurchaseList() {
    const router = useRouter()
    const { purchases, total, page, totalPages, setPage, loading, deletePurchase, search, setSearch, summary } = usePurchases()
    const toast = useToast()
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [newSupplierOpen, setNewSupplierOpen] = useState(false)
    const [newPurchaseOpen, setNewPurchaseOpen] = useState(false)
    const loadSuppliers = useSupplierStore((s) => s.loadSuppliers)
    const createSupplier = useSupplierStore((s) => s.createSupplier)

    const onDelete = (id: string) => {
        setSelectedId(id)
        setConfirmOpen(true)
    }

    const handleConfirm = async () => {
        if (!selectedId) return
        const removed = await deletePurchase(selectedId)
        if (removed) {
            toast.push({ title: 'Sucesso', description: purchaseMessages.deleted, type: 'success' })
        } else {
            toast.push({
                title: 'Erro',
                description: getFeedbackErrorMessage(usePurchaseStore.getState().error, purchaseMessages.notFound),
                type: 'error',
            })
        }
        setConfirmOpen(false)
        setSelectedId(null)
    }

    return (
        <div className="space-y-6">
            <PurchaseSummaryCards
                totalPurchases={summary.totalPurchases}
                monthlyPurchases={summary.monthlyPurchases}
                totalAmount={summary.totalAmount}
                invoiceIssued={summary.invoiceIssued}
            />

            <PurchaseFiltersCard
                search={search}
                onSearchChange={setSearch}
                onReset={() => setSearch('')}
                onCreatePurchase={() => setNewPurchaseOpen(true)}
                onCreateSupplier={() => {
                    setNewSupplierOpen(true)
                    loadSuppliers()
                }}
            />

            <DataTableSection
                title="Listagem de Compras"
                description="Visão consolidada das compras registradas no sistema."
                tableClassName="min-w-[1280px]"
                columns={[
                    { header: 'Fornecedor', className: 'w-[280px] min-w-[280px] px-4' },
                    { header: 'Categorias', className: 'w-[220px] min-w-[220px] px-4' },
                    { header: 'Data', className: 'w-28 whitespace-nowrap px-4' },
                    { header: 'NF', className: 'w-32 whitespace-nowrap px-4' },
                    { header: 'Total', className: 'w-32 whitespace-nowrap px-4' },
                    { header: 'Ações', className: 'w-[250px] whitespace-nowrap px-4' },
                ]}
                rowCount={purchases.length}
                colSpan={6}
                loading={loading}
                emptyContent={
                    <EmptyStateAction
                        title={search.trim() ? 'Sem resultado' : 'Sem compras'}
                        description={search.trim() ? 'Ajuste a busca.' : 'Registre a primeira compra.'}
                        actionLabel="Nova Compra"
                        onAction={() => setNewPurchaseOpen(true)}
                    />
                }
                footer={
                    <div className="flex items-center justify-between text-sm">
                        <div>Total filtrado: {total}</div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
                                Anterior
                            </Button>
                            <span>
                                {page} / {totalPages}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                                Próxima
                            </Button>
                        </div>
                    </div>
                }
                dialog={
                    <ConfirmDialog
                        open={confirmOpen}
                        title="Excluir compra"
                        description="Tem certeza que deseja excluir esta compra? Esta ação não poderá ser desfeita."
                        onConfirm={handleConfirm}
                        onCancel={() => setConfirmOpen(false)}
                    />
                }
            >
                {purchases.map((p) => (
                    <tr key={p.id}>
                        <td className="px-4 py-2 align-middle whitespace-nowrap">{p.supplier}</td>
                        <td className="px-4 py-2 align-middle">
                            <div className="flex flex-wrap gap-1">
                                {Array.from(new Set((p.items ?? []).map((item) => item.category || 'geral'))).map((category) => (
                                    <span
                                        key={category}
                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPurchaseCategoryChipClassName(category, false)}`}
                                    >
                                        {getPurchaseCategoryLabel(category)}
                                    </span>
                                ))}
                            </div>
                        </td>
                        <td className="px-4 py-2 align-middle whitespace-nowrap">{p.purchaseDate.slice(0, 10)}</td>
                        <td className="px-4 py-2 align-middle whitespace-nowrap">{p.invoiceNumber || 'Não informado'}</td>
                        <td className="px-4 py-2 align-middle whitespace-nowrap">R$ {p.total.toFixed(2)}</td>
                        <td className="px-4 py-2 align-middle whitespace-nowrap">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/purchases/${p.id}`)}>
                                    Visualizar
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/purchases/${p.id}/edit`)}>
                                    Editar
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => onDelete(p.id)}>
                                    Excluir
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))}
            </DataTableSection>
            <NewSupplierModal
                open={newSupplierOpen}
                onOpenChange={setNewSupplierOpen}
                onCreate={async (name: string) => {
                    return createSupplier(name)
                }}
            />
            <NewPurchaseMethodModal open={newPurchaseOpen} onOpenChange={setNewPurchaseOpen} />
        </div>
    )
}
