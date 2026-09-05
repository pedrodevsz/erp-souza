"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge } from '@/components/ui'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { DataTableSection } from '@/components/shared'
import { SalesSummaryCards } from './sales-summary-cards'
import { SalesFiltersCard } from './sales-filters-card'
import { useSales } from '@/hooks/sales/useSales'
import { PageLoading } from '@/components/shared/page-loading'
import { EmptyStateAction } from '@/components/shared'
import { createSaleReference, formatCurrency, getSalePaymentMethodLabel, SALE_DELIVERY_STATUS_VARIANTS, SALE_DELIVERY_STATUS_LABELS, SALE_PAYMENT_STATUS_LABELS, SALE_PAYMENT_STATUS_VARIANTS } from '@/lib/sales'
import { saleMessages, getFeedbackErrorMessage } from '@/lib/messages/feedback'
import { useSaleStore } from '@/stores/useSaleStore'

export function SalesList() {
  const router = useRouter()
  const toast = useToast()
  const {
    sales,
    total,
    page,
    totalPages,
    setPage,
    loading,
    deleteSale,
    search,
    setSearch,
    filters,
    setFilters,
    summary,
    hydrated,
  } = useSales()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const openDelete = (id: string) => {
    setSelectedId(id)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedId) return
    const removed = await deleteSale(selectedId)
    if (removed) {
      toast.push({ title: 'Sucesso', description: saleMessages.deleted, type: 'success' })
    } else {
      toast.push({
        title: 'Erro',
        description: getFeedbackErrorMessage(useSaleStore.getState().error, saleMessages.notFound),
        type: 'error',
      })
    }
    setConfirmOpen(false)
    setSelectedId(null)
  }

  return (
    <div className="space-y-6">
      {!hydrated ? (
        <PageLoading label="Carregando vendas..." />
      ) : (
        <>
          <PageHeader title="Vendas" description="Gerencie o ciclo completo das vendas do ERP." />

          <SalesSummaryCards
            totalSales={summary.totalSales}
            monthlySales={summary.monthlySales}
            totalAmount={summary.totalAmount}
            deliveriesPending={summary.deliveriesPending}
            deliveredOrders={summary.deliveredOrders}
          />

          <SalesFiltersCard
            search={search}
            onSearchChange={setSearch}
            filters={filters}
              onFiltersChange={setFilters}
              onReset={() => {
                setSearch('')
                setFilters({
                  deliveryStatus: 'all',
                  paymentMethod: 'all',
                })
              }}
          />

          <DataTableSection
            title="Listagem de Vendas"
            description="Tabela moderna com visão geral das vendas registradas."
            tableClassName="min-w-[1180px]"
            columns={[
              { header: 'Número', className: 'w-28 whitespace-nowrap px-4' },
              { header: 'Cliente', className: 'w-[280px] min-w-[280px] px-4' },
              { header: 'Data', className: 'w-28 whitespace-nowrap px-4' },
              { header: 'Valor', className: 'w-32 whitespace-nowrap px-4' },
              { header: 'Entrega', className: 'w-32 whitespace-nowrap px-4' },
              { header: 'Forma de Pagamento', className: 'w-44 whitespace-nowrap px-4' },
              { header: 'Status', className: 'w-28 whitespace-nowrap px-4' },
              { header: 'Vendedor', className: 'w-[180px] min-w-[180px] px-4' },
              { header: 'Ações', className: 'w-[250px] whitespace-nowrap px-4' },
            ]}
            rowCount={sales.length}
            colSpan={9}
            loading={loading}
            emptyContent={
              <EmptyStateAction
                title={search.trim() ? 'Sem resultado' : 'Sem vendas'}
                description={search.trim() ? 'Ajuste os filtros.' : 'Cadastre a primeira venda.'}
                actionLabel="Nova Venda"
                href="/dashboard/sales/new"
              />
            }
            footer={
              <div className="flex items-center justify-between text-sm">
                <div>Total filtrado: {total}</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={Boolean(page <= 1)}>
                    Anterior
                  </Button>
                  <span>
                    {page} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={Boolean(page >= totalPages)}>
                    Próxima
                  </Button>
                </div>
              </div>
            }
            dialog={
              <ConfirmDialog
                open={confirmOpen}
                title="Excluir venda"
                description="Tem certeza que deseja excluir esta venda? Esta ação não poderá ser desfeita."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
              />
            }
          >
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-4 py-2 align-middle font-medium whitespace-nowrap">{createSaleReference(sale.id)}</td>
                <td className="px-4 py-2 align-middle whitespace-nowrap">{sale.customerName}</td>
                <td className="px-4 py-2 align-middle whitespace-nowrap">{sale.saleDate.slice(0, 10)}</td>
                <td className="px-4 py-2 align-middle whitespace-nowrap">{formatCurrency(sale.total)}</td>
                <td className="px-4 py-2 align-middle whitespace-nowrap">
                  <Badge variant={SALE_DELIVERY_STATUS_VARIANTS[sale.deliveryStatus]}>{SALE_DELIVERY_STATUS_LABELS[sale.deliveryStatus]}</Badge>
                </td>
                <td className="px-4 py-2 align-middle whitespace-nowrap">
                  <div className="flex flex-col">
                    <span>{getSalePaymentMethodLabel(sale.paymentCondition, sale.paymentMethod, sale.payments)}</span>
                    <span className="text-xs text-slate-500">
                      Pago {formatCurrency(sale.paidAmount)} de {formatCurrency(sale.total)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 align-middle whitespace-nowrap">
                  <Badge variant={SALE_PAYMENT_STATUS_VARIANTS[sale.paymentStatus]}>{SALE_PAYMENT_STATUS_LABELS[sale.paymentStatus]}</Badge>
                </td>
                <td className="px-4 py-2 align-middle whitespace-nowrap">{sale.sellerName}</td>
                <td className="px-4 py-2 align-middle whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/sales/${sale.id}`)}>
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/sales/${sale.id}/edit`)}
                    >
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openDelete(sale.id)}>
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTableSection>
        </>
      )}
    </div>
  )
}
