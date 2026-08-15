import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { InventoryService } from '@/services/inventories/inventoryService'
import type { InventoryFilters, InventoryItem, NewInventoryItem, UpdateInventoryItem } from '@/types/inventory'

const DEFAULT_FILTERS: InventoryFilters = {
  category: 'all',
  supplier: 'all',
  status: 'all',
}

type State = {
  items: InventoryItem[]
  selectedItem: InventoryItem | null
  loading: boolean
  error: string | null
  search: string
  page: number
  pageSize: number
  filters: InventoryFilters
}

type Actions = {
  loadInventory: () => Promise<void>
  createItem: (data: NewInventoryItem) => Promise<InventoryItem | null>
  updateItem: (id: string, data: UpdateInventoryItem) => Promise<InventoryItem | null>
  deleteItem: (id: string) => Promise<boolean>
  findById: (id: string) => Promise<InventoryItem | null>
  selectItem: (id: string | null) => void
  clearSelection: () => void
  setSearch: (value: string) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setFilters: (filters: Partial<InventoryFilters>) => void
  reset: () => void
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  return String(error || fallback)
}

const createStore = () =>
  create<State & Actions>()(
    devtools(
      (set, get) => ({
        items: [],
        selectedItem: null,
        loading: false,
        error: null,
        search: '',
        page: 1,
        pageSize: 10,
        filters: DEFAULT_FILTERS,

        loadInventory: async () => {
          set({ loading: true, error: null })
          try {
            const data = await InventoryService.getAll()
            set({ items: data, loading: false })
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao carregar estoque'), loading: false })
          }
        },

        createItem: async (data) => {
          set({ loading: true, error: null })
          try {
            const created = await InventoryService.create(data)
            set((state) => ({ items: [created, ...state.items], selectedItem: created, loading: false }))
            return created
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao criar item'), loading: false })
            return null
          }
        },

        updateItem: async (id, data) => {
          set({ loading: true, error: null })
          try {
            const updated = await InventoryService.update(id, data)
            if (!updated) {
              set({ error: 'Item não encontrado', loading: false })
              return null
            }

            set((state) => ({
              items: state.items.map((item) => (item.id === id ? updated : item)),
              selectedItem: state.selectedItem?.id === id ? updated : state.selectedItem,
              loading: false,
            }))
            return updated
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao atualizar item'), loading: false })
            return null
          }
        },

        deleteItem: async (id) => {
          set({ loading: true, error: null })
          try {
            const ok = await InventoryService.delete(id)
            if (!ok) {
              set({ error: 'Item não encontrado', loading: false })
              return false
            }

            set((state) => ({
              items: state.items.filter((item) => item.id !== id),
              selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
              loading: false,
            }))
            return true
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao excluir item'), loading: false })
            return false
          }
        },

        findById: async (id) => {
          set({ loading: true, error: null })
          try {
            const found = await InventoryService.getById(id)
            set({ loading: false })
            return found
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao buscar item'), loading: false })
            return null
          }
        },

        selectItem: (id) => {
          if (!id) {
            set({ selectedItem: null })
            return
          }

          const item = get().items.find((entry) => entry.id === id) ?? null
          set({ selectedItem: item })
        },

        clearSelection: () => set({ selectedItem: null }),

        setSearch: (value) => set({ search: value, page: 1 }),

        setPage: (page) => set({ page }),

        setPageSize: (pageSize) => set({ pageSize, page: 1 }),

        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters },
            page: 1,
          })),

        reset: () =>
          set({
            items: [],
            selectedItem: null,
            loading: false,
            error: null,
            search: '',
            page: 1,
            pageSize: 10,
            filters: DEFAULT_FILTERS,
          }),
      }),
      { name: 'useInventoryStore' }
    )
  )

export const useInventoryStore = createStore()
export { DEFAULT_FILTERS }
