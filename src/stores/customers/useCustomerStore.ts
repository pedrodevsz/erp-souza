import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Customer, NewCustomer, UpdateCustomer } from '@/types/customer'
import { CustomerService } from '@/services/customerService'

type State = {
    customers: Customer[]
    selectedCustomer: Customer | null
    loading: boolean
    error: string | null
    search: string
    page: number
    pageSize: number
}

type Actions = {
    loadCustomers: (search?: string) => Promise<void>
    createCustomer: (data: NewCustomer) => Promise<Customer | null>
    updateCustomer: (id: string, data: UpdateCustomer) => Promise<Customer | null>
    deleteCustomer: (id: string) => Promise<boolean>
    findCustomerById: (id: string) => Promise<Customer | null>
    selectCustomer: (id: string | null) => void
    clearSelectedCustomer: () => void
    setSearch: (v: string) => void
    setPage: (p: number) => void
    reset: () => void
}

const createStore = () =>
    create<State & Actions>()(
        devtools(
            (set, get) => ({
                customers: [],
                selectedCustomer: null,
                loading: false,
                error: null,
                search: '',
                page: 1,
                pageSize: 10,

                loadCustomers: async (search?: string) => {
                    set({ loading: true, error: null })
                    try {
                        const data = await CustomerService.getAll(search)
                        set({ customers: data, loading: false, error: null })
                    } catch (e: unknown) {
                        set({ error: e instanceof Error ? e.message : String(e ?? 'Erro ao carregar'), loading: false })
                    }
                },

                createCustomer: async (data) => {
                    set({ loading: true })
                    try {
                        const created = await CustomerService.create(data)
                        await get().loadCustomers(get().search)
                        return created
                    } catch (e: unknown) {
                        set({ error: e instanceof Error ? e.message : String(e ?? 'Erro ao criar'), loading: false })
                        return null
                    }
                },

                updateCustomer: async (id, data) => {
                    set({ loading: true })
                    try {
                        const updated = await CustomerService.update(id, data)
                        if (updated) {
                            await get().loadCustomers(get().search)
                            return updated
                        }

                        set({ error: 'Cliente não encontrado', loading: false })
                        return null
                    } catch (e: unknown) {
                        set({ error: e instanceof Error ? e.message : String(e ?? 'Erro ao atualizar'), loading: false })
                        return null
                    }
                },

                deleteCustomer: async (id) => {
                    set({ loading: true })
                    try {
                        const ok = await CustomerService.delete(id)
                        if (ok) {
                            await get().loadCustomers(get().search)
                            return true
                        }

                        set({ error: 'Cliente não encontrado', loading: false })
                        return false
                    } catch (e: unknown) {
                        set({ error: e instanceof Error ? e.message : String(e ?? 'Erro ao excluir'), loading: false })
                        return false
                    }
                },

                findCustomerById: async (id) => {
                    set({ loading: true })
                    try {
                        const cached = get().customers.find((x) => x.id === id) || null
                        const found = cached ?? (await CustomerService.getById(id))
                        set({ loading: false })
                        return found
                    } catch (e: unknown) {
                        set({ error: e instanceof Error ? e.message : String(e ?? 'Erro ao buscar'), loading: false })
                        return null
                    }
                },

                selectCustomer: (id) => {
                    if (!id) return set({ selectedCustomer: null })
                    const c = get().customers.find((x) => x.id === id) || null
                    set({ selectedCustomer: c })
                },

                clearSelectedCustomer: () => set({ selectedCustomer: null }),

                setSearch: (v) => set({ search: v, page: 1 }),

                setPage: (p) => set({ page: p }),

                reset: () => set({ customers: [], selectedCustomer: null, loading: false, error: null, search: '', page: 1, pageSize: 10 }),
            }),
            { name: 'useCustomerStore' }
        )
    )

export const useCustomerStore = createStore()
