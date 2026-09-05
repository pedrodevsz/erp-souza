import { useEffect, useState } from 'react'
import { useInventory } from '@/hooks/inventory/useInventory'
import type { InventoryItem } from '@/types/inventory'

type State = {
    item: InventoryItem | null
    loading: boolean
}

export function useInventoryViewPage(id: string) {
    const { findById, loadMovementsByItem, selectItem, clearSelection } = useInventory()
    const [state, setState] = useState<State>({
        item: null,
        loading: true,
    })

    useEffect(() => {
        let active = true

        async function load() {
            if (!id) {
                if (!active) return
                setState({ item: null, loading: false })
                return
            }

            const found = await findById(id)
            if (!active) return

            setState({
                item: found,
                loading: false,
            })

            if (found) {
                selectItem(found.id)
                await loadMovementsByItem(found.id)
            }
        }

        load()

        return () => {
            active = false
            clearSelection()
        }
    }, [clearSelection, findById, id, loadMovementsByItem, selectItem])

    return {
        item: state.item,
        loading: state.loading,
    } as const
}
