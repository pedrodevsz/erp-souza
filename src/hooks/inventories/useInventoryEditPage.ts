import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { buildInventoryFormValues } from '@/lib/inventories/inventory'
import { useInventory } from '@/hooks/inventories/useInventory'
import type { InventoryItem, NewInventoryItem } from '@/types/inventory'
import type { InventoryFormValues } from '@/validations/inventory/inventory-form'

type State = {
    item: InventoryItem | null
    initialValues: Partial<InventoryFormValues> | null
    loading: boolean
    loadedId: string | null
}

export function useInventoryEditPage(id: string) {
    const router = useRouter()
    const toast = useToast()
    const { findById, updateItem } = useInventory()
    const [state, setState] = useState<State>({
        item: null,
        initialValues: null,
        loading: true,
        loadedId: null,
    })

    useEffect(() => {
        let active = true

        async function loadItem() {
            if (!id) {
                if (!active) return
                setState({ item: null, initialValues: null, loading: false, loadedId: null })
                return
            }

            const found = await findById(id)
            if (!active) return

            setState({
                item: found,
                initialValues: buildInventoryFormValues(found),
                loading: false,
                loadedId: id,
            })
        }

        loadItem()

        return () => {
            active = false
        }
    }, [findById, id])

    const handleSubmit = async (payload: NewInventoryItem) => {
        const updated = await updateItem(id, payload)
        if (!updated) return

        toast.push({ title: 'Sucesso', description: 'Item atualizado com sucesso.', type: 'success' })
        router.push('/dashboard/stock')
    }

    return {
        item: state.item,
        initialValues: state.initialValues,
        loading: Boolean(id) && state.loadedId !== id ? true : state.loading,
        handleSubmit,
    } as const
}
