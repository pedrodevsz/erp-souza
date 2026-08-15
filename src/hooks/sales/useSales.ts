import { useCallback, useEffect, useMemo } from 'react'
import { useSaleStore } from '@/stores/useSaleStore'
import { SALE_DELIVERY_STATUS_LABELS, createSaleReference } from '@/lib/sales'
import type { Sale } from '@/types/sale'

type SalesSummary = {
  totalSales: number
  monthlySales: number
  totalAmount: number
  deliveriesPending: number
  deliveredOrders: number
}

export function useSales() {
  const sales = useSaleStore((state) => state.sales)
  const selectedSale = useSaleStore((state) => state.selectedSale)
  const loading = useSaleStore((state) => state.loading)
  const error = useSaleStore((state) => state.error)
  const search = useSaleStore((state) => state.search)
  const page = useSaleStore((state) => state.page)
  const pageSize = useSaleStore((state) => state.pageSize)
  const filters = useSaleStore((state) => state.filters)

  const loadSales = useSaleStore((state) => state.loadSales)
  const createSale = useSaleStore((state) => state.createSale)
  const updateSale = useSaleStore((state) => state.updateSale)
  const addSalePayment = useSaleStore((state) => state.addSalePayment)
  const deleteSale = useSaleStore((state) => state.deleteSale)
  const findSaleById = useSaleStore((state) => state.findSaleById)
  const selectSale = useSaleStore((state) => state.selectSale)
  const clearSelection = useSaleStore((state) => state.clearSelection)
  const setSearch = useSaleStore((state) => state.setSearch)
  const setPage = useSaleStore((state) => state.setPage)
  const setFilters = useSaleStore((state) => state.setFilters)
  const cancelSale = useSaleStore((state) => state.cancelSale)

  useEffect(() => {
    loadSales(search)
  }, [loadSales, search])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return sales.filter((sale) => {
      const matchesQuery =
        !query ||
        sale.customerName.toLowerCase().includes(query) ||
        sale.id.toLowerCase().includes(query) ||
        sale.sellerName.toLowerCase().includes(query) ||
        createSaleReference(sale.id).toLowerCase().includes(query)

      const matchesStatus = filters.deliveryStatus === 'all' || sale.deliveryStatus === filters.deliveryStatus
      const matchesPayment =
        filters.paymentMethod === 'all' ||
        sale.paymentMethod === filters.paymentMethod ||
        sale.payments.some((payment) => payment.paymentMethod === filters.paymentMethod) ||
        (sale.paymentCondition.installments ?? []).some((installment) => installment.paymentMethod === filters.paymentMethod)

      return matchesQuery && matchesStatus && matchesPayment
    })
  }, [filters.deliveryStatus, filters.paymentMethod, sales, search])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const paginated = useMemo(() => {
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize, totalPages])

  const summary: SalesSummary = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return filtered.reduce<SalesSummary>(
      (acc, sale) => {
        acc.totalSales += 1
        acc.totalAmount += sale.total

        const saleDate = new Date(sale.saleDate)
        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
          acc.monthlySales += 1
        }

        if (sale.deliveryStatus === 'PENDING') acc.deliveriesPending += 1
        if (sale.deliveryStatus === 'DELIVERED') acc.deliveredOrders += 1

        return acc
      },
      {
        totalSales: 0,
        monthlySales: 0,
        totalAmount: 0,
        deliveriesPending: 0,
        deliveredOrders: 0,
      }
    )
  }, [filtered])

  const refresh = useCallback(() => loadSales(search), [loadSales, search])

  return {
    sales: paginated,
    allSales: sales, selectedSale, loading, error, search, page, pageSize, filters, total, totalPages, summary,
    loadSales: refresh,
    createSale,
    updateSale,
    addSalePayment,
    deleteSale,
    findSaleById,
    selectSale,
    clearSelection,
    setSearch,
    setPage,
    setFilters,
    cancelSale,
    saleStatusLabel: (status: Sale['deliveryStatus']) => SALE_DELIVERY_STATUS_LABELS[status],
    hydrated: true,
  } as const
}
