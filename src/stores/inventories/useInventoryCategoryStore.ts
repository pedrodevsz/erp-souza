import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { InventoryCategoryService } from '@/services/inventories/inventoryCategoryService'

type State = {
  categories: string[]
  loading: boolean
  error: string | null
}

type Actions = {
  loadCategories: () => Promise<void>
  createCategory: (name: string) => Promise<void>
  reset: () => void
}

const createStore = () =>
  create<State & Actions>()(
    devtools((set) => ({
      categories: [],
      loading: false,
      error: null,

      loadCategories: async () => {
        set({ loading: true, error: null })
        try {
          const categories = await InventoryCategoryService.getAll()
          set({ categories, loading: false })
        } catch (error: unknown) {
          set({ error: String(error ?? 'Erro ao carregar categorias'), loading: false })
        }
      },

      createCategory: async (name: string) => {
        set({ loading: true, error: null })
        try {
          const categories = await InventoryCategoryService.create(name)
          set({ categories, loading: false })
        } catch (error: unknown) {
          set({ error: String(error ?? 'Erro ao criar categoria'), loading: false })
        }
      },

      reset: () => set({ categories: [], loading: false, error: null }),
    }))
  )

export const useInventoryCategoryStore = createStore()
