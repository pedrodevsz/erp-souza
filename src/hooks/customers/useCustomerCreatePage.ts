import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { useCustomers } from '@/hooks/customers/useCustomers'
import { customerMessages, getFeedbackErrorMessage } from '@/lib/messages/feedback'
import { useCustomerStore } from '@/stores/customers/useCustomerStore'
import type { NewCustomer } from '@/types/customer'

export function useCustomerCreatePage() {
    const router = useRouter()
    const toast = useToast()
    const { createCustomer } = useCustomers()

    const handleSubmit = async (payload: NewCustomer) => {
        const created = await createCustomer(payload)
        if (!created) {
            toast.push({
                title: 'Erro',
                description: getFeedbackErrorMessage(useCustomerStore.getState().error, customerMessages.duplicate),
                type: 'error',
            })
            return
        }

        toast.push({ title: 'Sucesso', description: customerMessages.created, type: 'success' })
        router.push('/dashboard/customers')
    }

    return {
        handleSubmit,
    } as const
}
