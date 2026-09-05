import { useEffect, useState } from 'react'
import { usePurchases } from '@/hooks/purchases/usePurchases'
import type { Purchase } from '@/types/purchases'

type State = {
    purchase: Purchase | null
    loading: boolean
    loadedId: string | null
}

export function usePurchaseViewPage(id: string) {
    const { findPurchaseById } = usePurchases()
    const [state, setState] = useState<State>({
        purchase: null,
        loading: true,
        loadedId: null,
    })

    useEffect(() => {
        let active = true

        async function loadPurchase() {
            if (!id) {
                if (!active) return
                setState({ purchase: null, loading: false, loadedId: null })
                return
            }

            const found = await findPurchaseById(id)
            if (!active) return

            setState({
                purchase: found,
                loading: false,
                loadedId: id,
            })
        }

        loadPurchase()

        return () => {
            active = false
        }
    }, [findPurchaseById, id])

    return {
        purchase: state.purchase,
        loading: Boolean(id) && state.loadedId !== id ? true : state.loading,
    } as const
}
