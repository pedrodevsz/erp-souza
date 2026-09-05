import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { buildPurchaseFormValues } from '@/lib/purchases'
import { purchaseMessages } from '@/lib/messages/feedback'
import { usePurchases } from '@/hooks/purchases/usePurchases'
import type { Purchase, NewPurchase } from '@/types/purchases'

type State = {
    purchase: Purchase | null
    initialValues: Partial<NewPurchase> | null
    loading: boolean
    loadedId: string | null
}

export function usePurchaseEditPage(id: string) {
    const router = useRouter()
    const toast = useToast()
    const { findPurchaseById, updatePurchase } = usePurchases()
    const [state, setState] = useState<State>({
        purchase: null,
        initialValues: null,
        loading: true,
        loadedId: null,
    })

    useEffect(() => {
        let active = true

        async function loadPurchase() {
            if (!id) {
                if (!active) return
                setState({ purchase: null, initialValues: null, loading: false, loadedId: null })
                return
            }

            const found = await findPurchaseById(id)
            if (!active) return

            setState({
                purchase: found,
                initialValues: buildPurchaseFormValues(found),
                loading: false,
                loadedId: id,
            })
        }

        loadPurchase()

        return () => {
            active = false
        }
    }, [findPurchaseById, id])

    const handleSubmit = async (payload: NewPurchase) => {
        const updated = await updatePurchase(id, payload)
        if (!updated) return

        toast.push({ title: 'Sucesso', description: purchaseMessages.updated, type: 'success' })
        router.push('/dashboard/purchases')
    }

    return {
        purchase: state.purchase,
        initialValues: state.initialValues,
        loading: Boolean(id) && state.loadedId !== id ? true : state.loading,
        handleSubmit,
    } as const
}
