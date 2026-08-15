import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Purchase, NewPurchase, UpdatePurchase } from '@/types/purchases'
import { PurchaseService } from '@/services/purchaseService'

type State = {
    purchases: Purchase[]
    selectedPurchase: Purchase | null
    loading: boolean
    error: string | null
    search: string
    page: number
    pageSize: number
}

type Actions = {
    loadPurchases: (search?: string) => Promise<void>
    createPurchase: (data: NewPurchase) => Promise<Purchase | null>
    updatePurchase: (id: string, data: UpdatePurchase) => Promise<Purchase | null>
    deletePurchase: (id: string) => Promise<boolean>
    findPurchaseById: (id: string) => Promise<Purchase | null>
    selectPurchase: (id: string | null) => void
    clearSelectedPurchase: () => void
    setSearch: (v: string) => void
    setPage: (p: number) => void
    reset: () => void
}

const createStore = () =>
    create<State & Actions>()(
        devtools(
            (set, get) => ({
                    purchases: [],
                    selectedPurchase: null,
                    loading: false,
                    error: null,
                    search: '',
                    page: 1,
                    pageSize: 10,

                    loadPurchases: async (search?: string) => {
                        set({ loading: true, error: null })
                        try {
                            const data = await PurchaseService.getAll(search)
                            set({ purchases: data, loading: false })
                        } catch (e: unknown) {
                            set({ error: String(e ?? 'Erro ao carregar compras'), loading: false })
                        }
                    },

                    createPurchase: async (data) => {
                        set({ loading: true, error: null })
                        try {
                            const created = await PurchaseService.create(data)
                            set((s) => ({ purchases: [created, ...s.purchases], loading: false }))
                            return created
                        } catch (e: unknown) {
                            set({ error: String(e ?? 'Erro ao criar compra'), loading: false })
                            return null
                        }
                    },

                    updatePurchase: async (id, data) => {
                        set({ loading: true, error: null })
                        try {
                            const updated = await PurchaseService.update(id, data)
                            if (updated) {
                                set((s) => ({ purchases: s.purchases.map((p) => (p.id === id ? updated : p)), loading: false }))
                                return updated
                            }

                            set({ error: 'Compra não encontrada', loading: false })
                            return null
                        } catch (e: unknown) {
                            set({ error: String(e ?? 'Erro ao atualizar compra'), loading: false })
                            return null
                        }
                    },

                    deletePurchase: async (id) => {
                        set({ loading: true })
                        try {
                            const ok = await PurchaseService.delete(id)
                            if (ok) {
                                set((s) => ({ purchases: s.purchases.filter((p) => p.id !== id), loading: false }))
                                return true
                            }

                            set({ error: 'Compra não encontrada', loading: false })
                            return false
                        } catch (e: unknown) {
                            set({ error: String(e ?? 'Erro ao excluir compra'), loading: false })
                            return false
                        }
                    },

                    findPurchaseById: async (id) => {
                        set({ loading: true })
                        try {
                            const found = await PurchaseService.getById(id)
                            set({ loading: false })
                            return found
                        } catch (e: unknown) {
                            set({ error: String(e ?? 'Erro ao buscar compra'), loading: false })
                            return null
                        }
                    },

                    selectPurchase: (id) => {
                        if (!id) return set({ selectedPurchase: null })
                        const p = get().purchases.find((x) => x.id === id) || null
                        set({ selectedPurchase: p })
                    },

                    clearSelectedPurchase: () => set({ selectedPurchase: null }),

                    setSearch: (v) => set({ search: v, page: 1 }),

                    setPage: (p) => set({ page: p }),

                    reset: () => set({ purchases: [], selectedPurchase: null, loading: false, error: null, search: '', page: 1 }),
                })
        )
    )

export const usePurchaseStore = createStore()
