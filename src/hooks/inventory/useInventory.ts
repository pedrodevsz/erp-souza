import { useCallback, useEffect, useMemo, useState } from 'react'
import { InventoryService } from '@/services/inventories/inventoryService'
import { useInventoryStore, DEFAULT_FILTERS } from '@/stores/inventories/useInventoryStore'
import {
  calculateInventoryStatus,
  calculateItemValue,
} from '@/lib/inventory'
import type {
  InventoryItem,
  InventoryMovement,
  InventoryStatus,
} from '@/types/inventory'

type InventorySummary = {
  totalProducts: number
  itemsInStock: number
  lowStock: number
  noStock: number
  totalValue: number
  totalStock: number
  minimumStock: number
  reservedStock: number
  availableStock: number
}

type CategoryBreakdown = Array<{
  category: string
  count: number
  percentage: number
}>

export function useInventory() {
  const items = useInventoryStore((state) => state.items)
  const selectedItem = useInventoryStore((state) => state.selectedItem)
  const loading = useInventoryStore((state) => state.loading)
  const error = useInventoryStore((state) => state.error)
  const search = useInventoryStore((state) => state.search)
  const page = useInventoryStore((state) => state.page)
  const pageSize = useInventoryStore((state) => state.pageSize)
  const filters = useInventoryStore((state) => state.filters)

  const loadInventory = useInventoryStore((state) => state.loadInventory)
  const createItem = useInventoryStore((state) => state.createItem)
  const updateItem = useInventoryStore((state) => state.updateItem)
  const deleteItem = useInventoryStore((state) => state.deleteItem)
  const findById = useInventoryStore((state) => state.findById)
  const selectItem = useInventoryStore((state) => state.selectItem)
  const clearSelection = useInventoryStore((state) => state.clearSelection)
  const setSearch = useInventoryStore((state) => state.setSearch)
  const setPage = useInventoryStore((state) => state.setPage)
  const setPageSize = useInventoryStore((state) => state.setPageSize)
  const setFilters = useInventoryStore((state) => state.setFilters)
  const reset = useInventoryStore((state) => state.reset)

  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  useEffect(() => {
    let active = true

    InventoryService.getRecentMovements(5).then((data) => {
      if (active) setRecentMovements(data)
    })

    return () => {
      active = false
    }
  }, [items])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items.filter((item) => {
      const status = calculateInventoryStatus(item)
      const matchesQuery =
        !query ||
        item.productName.toLowerCase().includes(query) ||
        item.product.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.supplier.toLowerCase().includes(query)

      const matchesCategory = filters.category === 'all' || item.category === filters.category
      const matchesSupplier = filters.supplier === 'all' || item.supplier === filters.supplier
      const matchesStatus = filters.status === 'all' || status === filters.status

      return matchesQuery && matchesCategory && matchesSupplier && matchesStatus
    })
  }, [filters.category, filters.status, filters.supplier, items, search])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))

  const paginatedItems = useMemo(() => {
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, page, pageSize, totalPages])

  const summary: InventorySummary = useMemo(() => {
    return items.reduce<InventorySummary>(
      (acc, item) => {
        const status = calculateInventoryStatus(item)
        acc.totalProducts += 1
        acc.totalValue += calculateItemValue(item)
        acc.totalStock += item.currentStock
        acc.minimumStock += item.minimumStock
        acc.reservedStock += item.reservedStock
        acc.availableStock += item.availableStock

        if (status === 'EM_ESTOQUE') acc.itemsInStock += 1
        if (status === 'ESTOQUE_BAIXO') acc.lowStock += 1
        if (status === 'SEM_ESTOQUE') acc.noStock += 1
        return acc
      },
      {
        totalProducts: 0,
        itemsInStock: 0,
        lowStock: 0,
        noStock: 0,
        totalValue: 0,
        totalStock: 0,
        minimumStock: 0,
        reservedStock: 0,
        availableStock: 0,
      }
    )
  }, [items])

  const categoryBreakdown: CategoryBreakdown = useMemo(() => {
    const total = items.length || 1
    const counts = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [items])

  const getStatus = useCallback((item: Pick<InventoryItem, 'currentStock' | 'minimumStock'>): InventoryStatus => {
    return calculateInventoryStatus(item)
  }, [])

  const loadMovementsByItem = useCallback(async (itemId: string) => {
    setMovementsLoading(true)
    try {
      const data = await InventoryService.getMovements(itemId)
      setMovements(data)
    } finally {
      setMovementsLoading(false)
    }
  }, [])

  return {
    items,
    selectedItem,
    loading,
    error,
    search,
    page,
    pageSize,
    filters,
    totalPages,
    filteredItems,
    paginatedItems,
    summary,
    categoryBreakdown,
    recentMovements,
    movements,
    movementsLoading,
    loadInventory,
    createItem,
    updateItem,
    deleteItem,
    findById,
    selectItem,
    clearSelection,
    setSearch,
    setPage,
    setPageSize,
    setFilters,
    reset,
    loadMovementsByItem,
    getStatus,
    clearFilters: () => setFilters(DEFAULT_FILTERS),
  } as const
}
