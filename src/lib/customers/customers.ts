import type { Customer, NewCustomer } from '@/types/customer'
import type { CustomerFormValues } from '@/validations/customers/new-client'
import { normalizeDocumentInput, normalizeTextInput } from '@/lib/text'

export const CUSTOMER_EMPTY_ADDRESS = {
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
}

export const CUSTOMER_FORM_DEFAULT_VALUES: CustomerFormValues = {
    fullName: '',
    document: '',
    phone: '',
    addresses: [],
    notes: '',
}

function hasMeaningfulText(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0
}

export function getPrimaryCustomerAddress(customer?: Customer | null) {
    return customer?.addresses?.[0] ?? { ...CUSTOMER_EMPTY_ADDRESS }
}

export function buildCustomerFormValues(customer?: Customer | null): Partial<CustomerFormValues> {
    if (!customer) return { ...CUSTOMER_FORM_DEFAULT_VALUES }

    return {
        fullName: customer.name,
        document: customer.document,
        phone: customer.phone,
        addresses: customer.addresses?.length ? customer.addresses.map((address) => ({ ...address })) : [],
        notes: customer.notes,
    }
}

export function buildCustomerPayload(values: CustomerFormValues): NewCustomer {
    const addresses = values.addresses
        .map((address) => ({
            zipCode: address.zipCode ?? '',
            street: address.street ?? '',
            number: address.number ?? '',
            complement: address.complement ?? '',
            district: address.district ?? '',
            city: address.city ?? '',
            state: address.state ?? '',
        }))
        .filter((address) => Object.values(address).some((field) => hasMeaningfulText(field)))

    return {
        name: normalizeTextInput(values.fullName),
        document: normalizeDocumentInput(values.document) || undefined,
        phone: values.phone ?? '',
        addresses: addresses.map((address) => ({
            ...address,
            street: normalizeTextInput(address.street),
            number: normalizeTextInput(address.number),
            complement: normalizeTextInput(address.complement),
            district: normalizeTextInput(address.district),
            city: normalizeTextInput(address.city),
            state: normalizeTextInput(address.state),
        })),
        notes: normalizeTextInput(values.notes ?? ''),
    }
}
