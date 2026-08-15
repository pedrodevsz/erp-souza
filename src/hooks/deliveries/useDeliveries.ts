import { useEffect, useMemo } from 'react'
import { useDeliveryStore } from '@/stores/useDeliveryStore'
import { isSameDay, isSameMonth, isWithinCurrentWeek } from '@/lib/deliveries'

type Summary = {
  deliveriesToday: number
  deliveriesThisMonth: number
  pendingThisWeek: number
  lateDeliveries: number
}

export function useDeliveries() {
  const hydrated = true
  const deliveries = useDeliveryStore((state) => state.deliveries)
  const selectedDelivery = useDeliveryStore((state) => state.selectedDelivery)
  const loading = useDeliveryStore((state) => state.loading)
  const error = useDeliveryStore((state) => state.error)
  const search = useDeliveryStore((state) => state.search)
  const page = useDeliveryStore((state) => state.page)
  const pageSize = useDeliveryStore((state) => state.pageSize)
  const filters = useDeliveryStore((state) => state.filters)

  const loadDeliveries = useDeliveryStore((state) => state.loadDeliveries)
  const updateDelivery = useDeliveryStore((state) => state.updateDelivery)
  const findDeliveryById = useDeliveryStore((state) => state.findDeliveryById)
  const selectDelivery = useDeliveryStore((state) => state.selectDelivery)
  const clearSelectedDelivery = useDeliveryStore((state) => state.clearSelectedDelivery)
  const setSearch = useDeliveryStore((state) => state.setSearch)
  const setFilters = useDeliveryStore((state) => state.setFilters)
  const setPage = useDeliveryStore((state) => state.setPage)
  const markAsInRoute = useDeliveryStore((state) => state.markAsInRoute)
  const markItemAsDelivered = useDeliveryStore((state) => state.markItemAsDelivered)
  const markItemAsPending = useDeliveryStore((state) => state.markItemAsPending)
  const completeDelivery = useDeliveryStore((state) => state.completeDelivery)
  const cancelDelivery = useDeliveryStore((state) => state.cancelDelivery)
  const reset = useDeliveryStore((state) => state.reset)

  useEffect(() => {
    if (!hydrated) return
    loadDeliveries({
      search,
      filters,
    })
  }, [filters, hydrated, loadDeliveries, search])

  const total = deliveries.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const paginated = useMemo(() => {
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    return deliveries.slice(start, start + pageSize)
  }, [deliveries, page, pageSize, totalPages])

  const summary: Summary = useMemo(() => {
    return deliveries.reduce<Summary>(
      (acc, delivery) => {
        if (isSameDay(delivery.scheduledDate)) acc.deliveriesToday += 1
        if (isSameMonth(delivery.scheduledDate)) acc.deliveriesThisMonth += 1
        if (isWithinCurrentWeek(delivery.scheduledDate) && delivery.status === 'PENDING') acc.pendingThisWeek += 1
        if (delivery.status === 'LATE') acc.lateDeliveries += 1
        return acc
      },
      {
        deliveriesToday: 0,
        deliveriesThisMonth: 0,
        pendingThisWeek: 0,
        lateDeliveries: 0,
      }
    )
  }, [deliveries])

  const refresh = async () => loadDeliveries()

  return {
    deliveries: paginated,
    allDeliveries: deliveries,
    selectedDelivery,
    loading,
    error,
    search,
    page,
    pageSize,
    filters,
    total,
    totalPages,
    summary,
    hydrated,
    loadDeliveries: refresh,
    updateDelivery,
    findDeliveryById,
    selectDelivery,
    clearSelectedDelivery,
    setSearch,
    setFilters,
    setPage,
    markAsInRoute,
    markItemAsDelivered,
    markItemAsPending,
    completeDelivery,
    cancelDelivery,
    reset,
  } as const
}
