import type { Supplier } from '@/types/supplier'

type ApiSuccessResponse<T> = { success: true; data: T }
type ApiErrorResponse = { success: false; message: string }

class SupplierApiError extends Error {
    readonly status: number

    constructor(message: string, status: number) {
        super(message)
        this.name = 'SupplierApiError'
        this.status = status
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    })

    const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null
    if (!response.ok || !payload || payload.success === false) {
        throw new SupplierApiError(payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.', response.status)
    }

    return payload.data
}

export const ProviderService = {
    async getSuppliers(search?: string): Promise<string[]> {
        const query = search ? `?search=${encodeURIComponent(search)}` : ''
        const suppliers = await request<Array<{ name: string }>>(`/api/suppliers${query}`)
        return suppliers.map((supplier) => supplier.name)
    },

    async createSupplier(name: string): Promise<Supplier> {
        return request<Supplier>('/api/suppliers', {
            method: 'POST',
            body: JSON.stringify({ name }),
        })
    },
}
