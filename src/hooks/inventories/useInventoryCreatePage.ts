import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { useInventory } from '@/hooks/inventories/useInventory'
import type { NewInventoryItem } from '@/types/inventory'

export function useInventoryCreatePage() {
    const router = useRouter()
    const toast = useToast()
    const { createItem } = useInventory()

    const handleSubmit = async (payload: NewInventoryItem) => {
        const created = await createItem(payload)
        if (!created) return

        toast.push({ title: 'Sucesso', description: 'Item criado com sucesso.', type: 'success' })
        router.push('/dashboard/stock')
    }

    return {
        handleSubmit,
    } as const
}
