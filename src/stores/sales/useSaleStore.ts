import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { SalesService } from '@/services/sales/sales.service'
import type { NewSale, Sale, SaleFilters, UpdateSale } from '@/types/sale'

export const DEFAULT_SALE_FILTERS: SaleFilters = {
  deliveryStatus: 'all',
  paymentMethod: 'all',
}

type State = {
  sales: Sale[]
  selectedSale: Sale | null
  loading: boolean
  error: string | null
  search: string
  page: number
  pageSize: number
  filters: SaleFilters
}

type Actions = {
  loadSales: (search?: string) => Promise<void>
  createSale: (data: NewSale) => Promise<Sale | null>
  updateSale: (id: string, data: UpdateSale) => Promise<Sale | null>
  addSalePayment: (id: string, data: { amount: number; date: string; paymentMethod?: string; notes?: string }) => Promise<Sale | null>
  deleteSale: (id: string) => Promise<boolean>
  findSaleById: (id: string) => Promise<Sale | null>
  selectSale: (id: string | null) => void
  clearSelection: () => void
  setSearch: (value: string) => void
  setPage: (page: number) => void
  setFilters: (filters: Partial<SaleFilters>) => void
  cancelSale: (id: string) => Promise<Sale | null>
  reset: () => void
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  return String(error || fallback)
}

async function refreshDeliveriesList() {
  const { useDeliveryStore } = await import('@/stores/useDeliveryStore')
  await useDeliveryStore.getState().loadDeliveries()
}

const createStore = () =>
  create<State & Actions>()(
    devtools((set, get) => ({
      sales: [],
      selectedSale: null,
      loading: false,
      error: null,
      search: '',
      page: 1,
      pageSize: 10,
      filters: DEFAULT_SALE_FILTERS,

      loadSales: async (search) => {
        set({ loading: true, error: null })
        try {
          const data = await SalesService.getAll(search ?? get().search)
          set({ sales: data, loading: false })
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Erro ao carregar vendas'), loading: false })
        }
      },

      createSale: async (data) => {
        set({ loading: true, error: null })
        try {
          const created = await SalesService.create(data)
          set((state) => ({ sales: [created, ...state.sales], selectedSale: created, loading: false }))
          void refreshDeliveriesList()
          return created
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Erro ao criar venda'), loading: false })
          return null
        }
      },

      updateSale: async (id, data) => {
        set({ loading: true, error: null })
        try {
          const updated = await SalesService.update(id, data)
          if (!updated) {
            set({ error: 'Venda não encontrada', loading: false })
            return null
          }

          set((state) => ({
            sales: state.sales.map((sale) => (sale.id === id ? updated : sale)),
            selectedSale: state.selectedSale?.id === id ? updated : state.selectedSale,
            loading: false,
          }))
          void refreshDeliveriesList()
          return updated
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Erro ao atualizar venda'), loading: false })
          return null
        }
      },

      addSalePayment: async (id, data) => {
        set({ loading: true, error: null })
        try {
          const updated = await SalesService.addPayment(id, data)
          if (!updated) {
            set({ error: 'Venda não encontrada', loading: false })
            return null
          }

          set((state) => ({
            sales: state.sales.map((sale) => (sale.id === id ? updated : sale)),
            selectedSale: state.selectedSale?.id === id ? updated : state.selectedSale,
            loading: false,
          }))
          void refreshDeliveriesList()
          return updated
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Erro ao registrar pagamento'), loading: false })
          return null
        }
      },

      deleteSale: async (id) => {
        set({ loading: true, error: null })
        try {
          const ok = await SalesService.delete(id)
          if (!ok) {
            set({ error: 'Venda não encontrada', loading: false })
            return false
          }

          set((state) => ({
            sales: state.sales.filter((sale) => sale.id !== id),
            selectedSale: state.selectedSale?.id === id ? null : state.selectedSale,
            loading: false,
          }))
          return true
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Erro ao excluir venda'), loading: false })
          return false
        }
      },

      findSaleById: async (id) => {
        set({ loading: true, error: null })
        try {
          const found = await SalesService.getById(id)
          set({ loading: false })
          return found
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Erro ao buscar venda'), loading: false })
          return null
        }
      },

      selectSale: (id) => {
        if (!id) {
          set({ selectedSale: null })
          return
        }

        const sale = get().sales.find((entry) => entry.id === id) ?? null
        set({ selectedSale: sale })
      },

      clearSelection: () => set({ selectedSale: null }),

      setSearch: (value) => set({ search: value, page: 1 }),

      setPage: (page) => set({ page }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
          page: 1,
        })),

      cancelSale: async (id) => {
        set({ loading: true, error: null })
        try {
          const cancelled = await SalesService.cancel(id)
          if (!cancelled) {
            set({ error: 'Venda não encontrada', loading: false })
            return null
          }

          set((state) => ({
            sales: state.sales.map((sale) => (sale.id === id ? cancelled : sale)),
            selectedSale: state.selectedSale?.id === id ? cancelled : state.selectedSale,
            loading: false,
          }))
          void refreshDeliveriesList()
          return cancelled
        } catch (error: unknown) {
          set({ error: getErrorMessage(error, 'Erro ao cancelar venda'), loading: false })
          return null
        }
      },

      reset: () =>
        set({
          sales: [],
          selectedSale: null,
          loading: false,
          error: null,
          search: '',
          page: 1,
          pageSize: 10,
          filters: DEFAULT_SALE_FILTERS,
        }),
    }))
  )

export const useSaleStore = createStore()
