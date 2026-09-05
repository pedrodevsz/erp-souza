import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { usePurchases } from '@/hooks/purchases/usePurchases'
import { purchaseMessages } from '@/lib/messages/feedback'
import type { NewPurchase } from '@/types/purchases'

export function usePurchaseCreatePage() {
    const router = useRouter()
    const toast = useToast()
    const { createPurchase } = usePurchases()

    const handleSubmit = async (payload: NewPurchase) => {
        const created = await createPurchase(payload)
        if (!created) return

        toast.push({ title: 'Sucesso', description: purchaseMessages.created, type: 'success' })
        router.push('/dashboard/purchases')
    }

    return {
        handleSubmit,
    } as const
}
