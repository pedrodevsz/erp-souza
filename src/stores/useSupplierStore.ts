import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ProviderService } from '@/services/inventories/providerService'
import type { Supplier } from '@/types/supplier'

type State = {
    suppliers: string[]
    loading: boolean
    error: string | null
}

type Actions = {
    loadSuppliers: () => Promise<void>
    createSupplier: (name: string) => Promise<Supplier>
    reset: () => void
}

const createStore = () =>
    create<State & Actions>()(
        devtools(
            (set) => ({
                suppliers: [],
                loading: false,
                error: null,

                loadSuppliers: async () => {
                    set({ loading: true, error: null })
                    try {
                        const data = await ProviderService.getSuppliers()
                        set({ suppliers: data, loading: false })
                    } catch (e: unknown) {
                        set({ error: e instanceof Error ? e.message : String(e || 'Erro ao carregar'), loading: false })
                    }
                },

                createSupplier: async (name: string) => {
                    set({ loading: true, error: null })
                    try {
                        const createdSupplier = await ProviderService.createSupplier(name)
                        set((s) => ({
                            suppliers: [
                                createdSupplier.name,
                                ...s.suppliers.filter((entry) => entry.toLowerCase() !== createdSupplier.name.toLowerCase()),
                            ],
                            loading: false,
                        }))
                        return createdSupplier
                    } catch (e: unknown) {
                        const message = e instanceof Error ? e.message : String(e || 'Erro ao criar')
                        set({ error: message, loading: false })
                        throw e
                    }
                },

                reset: () => set({ suppliers: [], loading: false, error: null }),
            }),
            { name: 'useSupplierStore' }
        )
    )

export const useSupplierStore = createStore()
