"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Eye, MoreHorizontal, Pencil, Route } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { DataTableSection, EmptyStateAction, PageLoading } from '@/components/shared'
import { Button, Badge, AlertDialog, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui'
import { useToast } from '@/components/ui/toast-provider'
import { DeliverySummaryCards } from './delivery-summary-cards'
import { DeliveryFiltersCard } from './delivery-filters-card'
import { useDeliveries } from '@/hooks/deliveries/useDeliveries'
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_VARIANTS, formatDate, getDeliveryItemProgress } from '@/lib/deliveries'
import { useDeliveryStore } from '@/stores/useDeliveryStore'

function formatDeliveryLocation(city?: string, state?: string) {
  const normalizedCity = city?.trim()
  const normalizedState = state?.trim()

  if (!normalizedCity && !normalizedState) {
    return 'Não informado'
  }

  if (normalizedCity && normalizedState) {
    return `${normalizedCity}/${normalizedState}`
  }

  return normalizedCity || normalizedState || 'Não informado'
}

export function DeliveryList() {
  const router = useRouter()
  const toast = useToast()
  const {
    deliveries,
    total,
    totalPages,
    page,
    setPage,
    loading,
    search,
    setSearch,
    filters,
    setFilters,
    summary,
    hydrated,
    markAsInRoute,
    completeDelivery,
    cancelDelivery,
  } = useDeliveries()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAllDeliveries, setShowAllDeliveries] = useState(false)
  const visibleDeliveries = showAllDeliveries ? deliveries : deliveries.slice(0, 5)
  const hasMoreDeliveries = deliveries.length > 5

  const openCancel = (id: string) => {
    setSelectedId(id)
    setCancelOpen(true)
  }

  const handleMarkInRoute = async (id: string) => {
    const updated = await markAsInRoute(id)
    if (updated) {
      toast.push({ title: 'Sucesso', description: 'Entrega marcada como em rota.', type: 'success' })
    } else {
      toast.push({
        title: 'Erro',
        description: useDeliveryStore.getState().error ?? 'Não foi possível atualizar a entrega.',
        type: 'error',
      })
    }
  }

  const handleCompleteDelivery = async (id: string) => {
    const updated = await completeDelivery(id)
    if (updated) {
      toast.push({ title: 'Sucesso', description: 'Entrega concluída.', type: 'success' })
      return
    }

    toast.push({
      title: 'Erro',
      description: useDeliveryStore.getState().error ?? 'Não foi possível concluir a entrega.',
      type: 'error',
    })
  }

  const confirmCancel = async () => {
    if (!selectedId) return
    const updated = await cancelDelivery(selectedId)
    if (updated) {
      toast.push({ title: 'Sucesso', description: 'Entrega cancelada.', type: 'success' })
    } else {
      toast.push({
        title: 'Erro',
        description: useDeliveryStore.getState().error ?? 'Não foi possível cancelar a entrega.',
        type: 'error',
      })
    }
    setCancelOpen(false)
    setSelectedId(null)
  }

  if (!hydrated) {
    return <PageLoading label="Carregando entregas..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Entregas" description="Acompanhe pedidos em rota, pendentes, concluídos e atrasados." />

      <DeliverySummaryCards
        deliveriesToday={summary.deliveriesToday}
        deliveriesThisMonth={summary.deliveriesThisMonth}
        pendingThisWeek={summary.pendingThisWeek}
        lateDeliveries={summary.lateDeliveries}
      />

      <DeliveryFiltersCard
        search={search}
        filters={filters}
        onSearchChange={(value) => {
          setShowAllDeliveries(false)
          setSearch(value)
        }}
        onFiltersChange={(nextFilters) => {
          setShowAllDeliveries(false)
          setFilters(nextFilters)
        }}
        onReset={() => {
          setShowAllDeliveries(false)
          setSearch('')
          setFilters({
            status: 'all',
            dateFrom: '',
            dateTo: '',
            city: '',
            driverName: '',
          })
        }}
      />

      <DataTableSection
        title="Lista de Entregas"
        description="Tabela com a visão operacional das entregas registradas."
        tableClassName="min-w-[1240px]"
        columns={[
          { header: 'Cliente', className: 'w-[240px] min-w-[240px] px-4' },
          { header: 'Venda', className: 'w-28 whitespace-nowrap px-4' },
          { header: 'Data Agendada', className: 'w-32 whitespace-nowrap px-4' },
          { header: 'Cidade', className: 'w-40 whitespace-nowrap px-4' },
          { header: 'Produtos', className: 'w-40 whitespace-nowrap px-4' },
          { header: 'Status', className: 'w-40 whitespace-nowrap px-4' },
          { header: 'Motorista', className: 'w-[180px] min-w-[180px] px-4' },
          { header: 'Ações', className: 'w-[140px] whitespace-nowrap px-4 text-center' },
        ]}
        rowCount={deliveries.length}
        colSpan={8}
        loading={loading}
        emptyContent={
          <EmptyStateAction
            title={search.trim() || filters.status !== 'all' || filters.dateFrom || filters.dateTo || filters.city || filters.driverName ? 'Sem resultado' : 'Sem entregas'}
            description={
              search.trim() || filters.status !== 'all' || filters.dateFrom || filters.dateTo || filters.city || filters.driverName
                ? 'Ajuste os filtros para encontrar a entrega.'
                : 'As entregas confirmadas em vendas aparecerão aqui.'
            }
          />
        }
        footer={
          <div className="flex items-center justify-between text-sm">
            <div>Total filtrado: {total}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAllDeliveries(false)
                  setPage(Math.max(1, page - 1))
                }}
                disabled={Boolean(page <= 1)}
              >
                Anterior
              </Button>
              <span>
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAllDeliveries(false)
                  setPage(Math.min(totalPages, page + 1))
                }}
                disabled={Boolean(page >= totalPages)}
              >
                Próxima
              </Button>
            </div>
          </div>
        }
        dialog={
          <AlertDialog
            open={cancelOpen}
            title="Cancelar entrega"
            description="Tem certeza que deseja cancelar esta entrega? Esta ação não poderá ser desfeita."
            confirmLabel="Cancelar entrega"
            confirmTone="danger"
            onConfirm={confirmCancel}
            onCancel={() => setCancelOpen(false)}
          />
        }
      >
        {visibleDeliveries.map((delivery) => {
          const progress = getDeliveryItemProgress(delivery.items)

          return (
            <tr key={delivery.id}>
              <td className="px-4 py-3 align-middle whitespace-nowrap">
                <div className="font-medium text-slate-900">{delivery.customerName}</div>
                <div className="text-xs text-slate-500">{delivery.customerPhone}</div>
              </td>
              <td className="px-4 py-3 align-middle whitespace-nowrap font-medium">{delivery.saleNumber}</td>
              <td className="px-4 py-3 align-middle whitespace-nowrap">{formatDate(delivery.scheduledDate)}</td>
              <td className="px-4 py-3 align-middle whitespace-nowrap">
                {formatDeliveryLocation(delivery.address.city, delivery.address.state)}
              </td>
              <td className="px-4 py-3 align-middle whitespace-nowrap">
                {progress.delivered}/{progress.total}
              </td>
              <td className="px-4 py-3 align-middle whitespace-nowrap">
                <Badge variant={DELIVERY_STATUS_VARIANTS[delivery.status]}>{DELIVERY_STATUS_LABELS[delivery.status]}</Badge>
              </td>
              <td className="px-4 py-3 align-middle whitespace-nowrap">{delivery.driverName?.trim() || 'Não informado'}</td>
              <td className="px-4 py-3 align-middle whitespace-nowrap text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-2 rounded-full px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      Ações
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/deliveries/${delivery.id}`)}>
                      <Eye className="h-4 w-4" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/deliveries/${delivery.id}/edit`)}>
                      <Pencil className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleMarkInRoute(delivery.id)}
                      disabled={delivery.status === 'CANCELLED' || delivery.status === 'DELIVERED'}
                    >
                      <Route className="h-4 w-4" />
                      Em rota
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCompleteDelivery(delivery.id)}
                      disabled={delivery.status === 'CANCELLED' || delivery.status === 'DELIVERED'}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Concluir
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => openCancel(delivery.id)}
                      disabled={delivery.status === 'CANCELLED'}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Cancelar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          )
        })}
        {hasMoreDeliveries && (
          <tr>
            <td colSpan={8} className="px-4 py-4">
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAllDeliveries((current) => !current)}
                  className="relative z-10 rounded-full border-slate-200 bg-white px-4 shadow-sm"
                >
                  {showAllDeliveries ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Ver mais
                    </>
                  )}
                </Button>
              </div>
            </td>
          </tr>
        )}
      </DataTableSection>
    </div>
  )
}
