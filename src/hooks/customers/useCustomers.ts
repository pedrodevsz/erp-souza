import { useCallback, useEffect } from 'react'
import { useCustomerStore } from '@/stores/customers/useCustomerStore'

export function useCustomers() {
    const customers = useCustomerStore((s) => s.customers)
    const search = useCustomerStore((s) => s.search)
    const page = useCustomerStore((s) => s.page)
    const pageSize = useCustomerStore((s) => s.pageSize)
    const loading = useCustomerStore((s) => s.loading)
    const error = useCustomerStore((s) => s.error)

    const loadCustomers = useCustomerStore((s) => s.loadCustomers)
    const createCustomer = useCustomerStore((s) => s.createCustomer)
    const updateCustomer = useCustomerStore((s) => s.updateCustomer)
    const deleteCustomer = useCustomerStore((s) => s.deleteCustomer)
    const findCustomerById = useCustomerStore((s) => s.findCustomerById)
    const selectCustomer = useCustomerStore((s) => s.selectCustomer)
    const clearSelectedCustomer = useCustomerStore((s) => s.clearSelectedCustomer)
    const setSearch = useCustomerStore((s) => s.setSearch)
    const setPage = useCustomerStore((s) => s.setPage)

    useEffect(() => {
        loadCustomers(search)
    }, [loadCustomers, search])

    const total = customers.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const paginated = customers.slice((page - 1) * pageSize, page * pageSize)

    const refresh = useCallback(() => loadCustomers(search), [loadCustomers, search])

    return {
        customers: paginated,
        total,
        totalPages,
        page,
        pageSize,
        loading,
        error,
        search,
        setSearch,
        setPage,
        loadCustomers: refresh,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        findCustomerById,
        selectCustomer,
        clearSelectedCustomer,
    } as const
}
