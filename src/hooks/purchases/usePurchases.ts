import { useCallback, useEffect, useMemo } from 'react'
import { usePurchaseStore } from '@/stores/purchases/usePurchaseStore'
import { getTodayBusinessDate, normalizeBusinessDate } from '@/lib/business-date'

export function usePurchases() {
    const purchases = usePurchaseStore((s) => s.purchases)
    const search = usePurchaseStore((s) => s.search)
    const page = usePurchaseStore((s) => s.page)
    const pageSize = usePurchaseStore((s) => s.pageSize)
    const loading = usePurchaseStore((s) => s.loading)
    const error = usePurchaseStore((s) => s.error)

    const loadPurchases = usePurchaseStore((s) => s.loadPurchases)
    const createPurchase = usePurchaseStore((s) => s.createPurchase)
    const updatePurchase = usePurchaseStore((s) => s.updatePurchase)
    const deletePurchase = usePurchaseStore((s) => s.deletePurchase)
    const findPurchaseById = usePurchaseStore((s) => s.findPurchaseById)
    const selectPurchase = usePurchaseStore((s) => s.selectPurchase)
    const clearSelectedPurchase = usePurchaseStore((s) => s.clearSelectedPurchase)
    const setSearch = usePurchaseStore((s) => s.setSearch)
    const setPage = usePurchaseStore((s) => s.setPage)

    useEffect(() => {
        loadPurchases(search)
    }, [loadPurchases, search])

    const total = purchases.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const paginated = useMemo(() => {
        const safePage = Math.min(page, totalPages)
        const start = (safePage - 1) * pageSize
        return purchases.slice(start, start + pageSize)
    }, [page, pageSize, purchases, totalPages])

    const summary = useMemo(() => {
        const currentMonth = getTodayBusinessDate().slice(0, 7)

        return purchases.reduce(
            (acc, purchase) => {
                acc.totalPurchases += 1
                acc.totalAmount += purchase.total

                if (normalizeBusinessDate(purchase.purchaseDate).slice(0, 7) === currentMonth) {
                    acc.monthlyPurchases += 1
                }

                if (purchase.invoiceNumber?.trim()) {
                    acc.invoiceIssued += 1
                }

                return acc
            },
            {
                totalPurchases: 0,
                monthlyPurchases: 0,
                totalAmount: 0,
                invoiceIssued: 0,
            }
        )
    }, [purchases])

    const refresh = useCallback(() => loadPurchases(search), [loadPurchases, search])

    return {
        purchases: paginated,
        total,
        totalPages,
        page,
        pageSize,
        loading,
        error,
        search,
        setSearch,
        setPage,
        loadPurchases: refresh,
        createPurchase,
        updatePurchase,
        deletePurchase,
        findPurchaseById,
        selectPurchase,
        clearSelectedPurchase,
        summary,
    } as const
}
