import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { buildCustomerFormValues } from '@/lib/customers/customers'
import { customerMessages, getFeedbackErrorMessage } from '@/lib/messages/feedback'
import { useCustomers } from '@/hooks/customers/useCustomers'
import { CustomerService } from '@/services/customerService'
import { useCustomerStore } from '@/stores/customers/useCustomerStore'
import type { NewCustomer } from '@/types/customer'
import type { CustomerFormValues } from '@/validations/customers/new-client'

type State = {
    initialValues: Partial<CustomerFormValues> | null
    loading: boolean
    found: boolean
}

export function useCustomerEditPage(id: string) {
    const router = useRouter()
    const toast = useToast()
    const { loadCustomers, updateCustomer } = useCustomers()
    const [state, setState] = useState<State>({
        initialValues: null,
        loading: true,
        found: false,
    })
    const [loadedId, setLoadedId] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function loadCustomer() {
            if (!id) {
                if (!active) return
                setState({ initialValues: null, loading: false, found: false })
                setLoadedId(null)
                return
            }

            let customer = await CustomerService.getById(id)
            if (!active) return

            if (!customer) {
                await loadCustomers()
                if (!active) return

                const cachedCustomer = useCustomerStore.getState().customers.find((x) => x.id === id) || null
                customer = cachedCustomer ?? (await CustomerService.getById(id))
                if (!customer) {
                    setState({ initialValues: null, loading: false, found: false })
                    setLoadedId(id)
                    return
                }
            }

            setState({
                initialValues: buildCustomerFormValues(customer),
                loading: false,
                found: true,
            })
            setLoadedId(id)
        }

        loadCustomer()

        return () => {
            active = false
        }
    }, [id, loadCustomers])

    const handleSubmit = async (payload: NewCustomer) => {
        const updated = await updateCustomer(id, payload)
        if (!updated) {
            toast.push({
                title: 'Erro',
                description: getFeedbackErrorMessage(useCustomerStore.getState().error, customerMessages.notFound),
                type: 'error',
            })
            return
        }

        toast.push({ title: 'Sucesso', description: customerMessages.updated, type: 'success' })
        router.push('/dashboard/customers')
    }

    return {
        initialValues: state.initialValues,
        loading: Boolean(id) && loadedId !== id ? true : state.loading,
        found: state.found,
        handleSubmit,
    } as const
}
