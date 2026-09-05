"use client"

import { CustomerInformationCard } from './customer-information-card'
import { CustomerAddressCard } from './customer-address-card'
import { CustomerNotesCard } from './customer-notes-card'
import { CustomerFormActions } from './customer-form-actions'
import { useForm, FormProvider, type Resolver, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { customerSchema, CustomerFormValues } from '@/validations/customers/new-client'
import { CUSTOMER_FORM_DEFAULT_VALUES, buildCustomerPayload } from '@/lib/customers/customers'
import type { NewCustomer } from '@/types/customer'

type Props = {
    initialValues?: Partial<CustomerFormValues>
    onSubmit?: (data: NewCustomer) => Promise<void> | void
    onCancel?: () => void
    submitLabel?: string
    inline?: boolean
}

export function CustomerForm({ initialValues, onSubmit, onCancel, submitLabel, inline = false }: Props) {
    const methods = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as Resolver<CustomerFormValues>,
        defaultValues: {
            ...CUSTOMER_FORM_DEFAULT_VALUES,
            ...initialValues,
        },
    })

    const handleSubmit: SubmitHandler<CustomerFormValues> = async (values) => {
        const payload = buildCustomerPayload(values)

        if (onSubmit) await onSubmit(payload)
        else console.log(payload)
    }

    return (
        <FormProvider {...methods}>
            {inline ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <CustomerInformationCard />
                        <CustomerAddressCard />
                        <CustomerNotesCard />
                        <CustomerFormActions
                            onCancel={onCancel}
                            submitLabel={submitLabel}
                            submitMode="button"
                            onSubmitClick={methods.handleSubmit(handleSubmit)}
                        />
                    </div>
                </div>
            ) : (
                <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <CustomerInformationCard />
                        <CustomerAddressCard />
                        <CustomerNotesCard />
                        <CustomerFormActions onCancel={onCancel} submitLabel={submitLabel} />
                    </div>
                </form>
            )}
        </FormProvider>
    )
}
