import {
    CustomerApiError,
    createCustomer as apiCreateCustomer,
    deleteCustomer as apiDeleteCustomer,
    getCustomerById as apiGetCustomerById,
    getCustomers as apiGetCustomers,
    updateCustomer as apiUpdateCustomer,
} from '@/lib/customers/customer-api'
import type { Customer, NewCustomer, UpdateCustomer } from '@/types/customer'

function normalizeAddress(address?: Partial<Customer['addresses'][number]> | null): Customer['addresses'][number] {
    return {
        zipCode: address?.zipCode ?? '',
        street: address?.street ?? '',
        number: address?.number ?? '',
        complement: address?.complement ?? '',
        district: address?.district ?? '',
        city: address?.city ?? '',
        state: address?.state ?? '',
    }
}

function normalizeCustomer(customer: Customer | null | undefined): Customer {
    return {
        id: customer?.id ?? '',
        name: customer?.name ?? '',
        document: customer?.document ?? '',
        phone: customer?.phone ?? '',
        addresses: customer?.addresses?.length ? customer.addresses.map((address) => normalizeAddress(address)) : [normalizeAddress()],
        notes: customer?.notes ?? '',
        createdAt: customer?.createdAt ?? new Date().toISOString(),
        updatedAt: customer?.updatedAt ?? new Date().toISOString(),
    }
}

function normalizeError(error: unknown) {
    if (error instanceof CustomerApiError) {
        return error
    }

    if (error instanceof Error) {
        return new Error(error.message)
    }

    return new Error('Erro inesperado.')
}

export const CustomerService = {
    async getAll(search?: string): Promise<Customer[]> {
        const data = await apiGetCustomers(search)
        return data.map((customer) => normalizeCustomer(customer))
    },

    async getById(id: string): Promise<Customer | null> {
        try {
            const customer = await apiGetCustomerById(id)
            return normalizeCustomer(customer)
        } catch (error) {
            if (error instanceof CustomerApiError && error.status === 404) return null
            throw normalizeError(error)
        }
    },

    async create(customer: NewCustomer): Promise<Customer> {
        try {
            const created = await apiCreateCustomer(customer)
            return normalizeCustomer(created)
        } catch (error) {
            throw normalizeError(error)
        }
    },

    async update(id: string, customer: UpdateCustomer): Promise<Customer | null> {
        try {
            const updated = await apiUpdateCustomer(id, customer)
            return normalizeCustomer(updated)
        } catch (error) {
            if (error instanceof CustomerApiError && error.status === 404) return null
            throw normalizeError(error)
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            await apiDeleteCustomer(id)
            return true
        } catch (error) {
            if (error instanceof CustomerApiError && error.status === 404) return false
            throw normalizeError(error)
        }
    },
}
