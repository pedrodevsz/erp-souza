import { useEffect, useState } from 'react'
import { useCustomers } from '@/hooks/customers/useCustomers'
import { CustomerService } from '@/services/customerService'
import { useCustomerStore } from '@/stores/customers/useCustomerStore'
import type { Customer } from '@/types/customer'

type State = {
    customer: Customer | null
    loading: boolean
}

export function useCustomerViewPage(id: string) {
    const { loadCustomers } = useCustomers()
    const [state, setState] = useState<State>({
        customer: null,
        loading: true,
    })
    const [loadedId, setLoadedId] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function loadCustomer() {
            if (!id) {
                if (!active) return
                setState({ customer: null, loading: false })
                setLoadedId(null)
                return
            }

            let found = await CustomerService.getById(id)
            if (!active) return

            if (!found) {
                await loadCustomers()
                if (!active) return

                const cachedCustomer = useCustomerStore.getState().customers.find((x) => x.id === id) || null
                found = cachedCustomer ?? (await CustomerService.getById(id))
            }

            setState({
                customer: found,
                loading: false,
            })
            setLoadedId(id)
        }

        loadCustomer()

        return () => {
            active = false
        }
    }, [id, loadCustomers])

    return {
        customer: state.customer,
        loading: Boolean(id) && loadedId !== id ? true : state.loading,
    } as const
}
