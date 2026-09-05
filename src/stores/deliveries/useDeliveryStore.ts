import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { DeliveryService } from '@/services/deliveries/deliveryService'
import type { Delivery, DeliveryFilters, UpdateDelivery } from '@/types/delivery'

export const DEFAULT_DELIVERY_FILTERS: DeliveryFilters = {
  status: 'all',
  dateFrom: '',
  dateTo: '',
  city: '',
  driverName: '',
}

type State = {
  deliveries: Delivery[]
  selectedDelivery: Delivery | null
  loading: boolean
  error: string | null
  search: string
  filters: DeliveryFilters
  page: number
  pageSize: number
}

type Actions = {
  loadDeliveries: (params?: { search?: string; filters?: Partial<DeliveryFilters> }) => Promise<void>
  updateDelivery: (id: string, data: UpdateDelivery) => Promise<Delivery | null>
  findDeliveryById: (id: string) => Promise<Delivery | null>
  selectDelivery: (id: string | null) => void
  clearSelectedDelivery: () => void
  setSearch: (value: string) => void
  setFilters: (filters: Partial<DeliveryFilters>) => void
  setPage: (page: number) => void
  markAsInRoute: (id: string) => Promise<Delivery | null>
  markItemAsDelivered: (deliveryId: string, itemId: string) => Promise<Delivery | null>
  markItemAsPending: (deliveryId: string, itemId: string) => Promise<Delivery | null>
  completeDelivery: (id: string) => Promise<Delivery | null>
  cancelDelivery: (id: string) => Promise<Delivery | null>
  reset: () => void
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  return String(error || fallback)
}

async function refreshSalesList() {
  const { useSaleStore } = await import('@/stores/useSaleStore')
  await useSaleStore.getState().loadSales()
}

const createStore = () =>
  create<State & Actions>()(
    devtools(
      (set, get) => ({
        deliveries: [],
        selectedDelivery: null,
        loading: false,
        error: null,
        search: '',
        filters: DEFAULT_DELIVERY_FILTERS,
        page: 1,
        pageSize: 10,

        loadDeliveries: async (params) => {
          set({ loading: true, error: null })
          try {
            const query = {
              search: params?.search ?? get().search,
              ...get().filters,
              ...params?.filters,
            }
            const data = await DeliveryService.getAll(query)
            set({ deliveries: data, loading: false })
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao carregar entregas'), loading: false })
          }
        },

        updateDelivery: async (id, data) => {
          set({ loading: true, error: null })
          try {
            const updated = await DeliveryService.update(id, data)
            if (!updated) {
              set({ error: 'Entrega não encontrada', loading: false })
              return null
            }

            set((state) => ({
              deliveries: state.deliveries.map((delivery) => (delivery.id === id ? updated : delivery)),
              selectedDelivery: state.selectedDelivery?.id === id ? updated : state.selectedDelivery,
              loading: false,
            }))
            void refreshSalesList()
            return updated
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao atualizar entrega'), loading: false })
            return null
          }
        },

        findDeliveryById: async (id) => {
          set({ loading: true, error: null })
          try {
            const cached = get().deliveries.find((delivery) => delivery.id === id) ?? null
            const found = cached ?? (await DeliveryService.getById(id))
            set({ loading: false })
            return found
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao buscar entrega'), loading: false })
            return null
          }
        },

        selectDelivery: (id) => {
          if (!id) {
            set({ selectedDelivery: null })
            return
          }

          const delivery = get().deliveries.find((entry) => entry.id === id) ?? null
          set({ selectedDelivery: delivery })
        },

        clearSelectedDelivery: () => set({ selectedDelivery: null }),

        setSearch: (value) => set({ search: value, page: 1 }),

        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters },
            page: 1,
          })),

        setPage: (page) => set({ page }),

        markAsInRoute: async (id) => {
          set({ loading: true, error: null })
          try {
            const updated = await DeliveryService.markAsInRoute(id)
            if (!updated) {
              set({ error: 'Entrega não encontrada', loading: false })
              return null
            }

            set((state) => ({
              deliveries: state.deliveries.map((delivery) => (delivery.id === id ? updated : delivery)),
              selectedDelivery: state.selectedDelivery?.id === id ? updated : state.selectedDelivery,
              loading: false,
            }))
            void refreshSalesList()
            return updated
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao atualizar entrega'), loading: false })
            return null
          }
        },

        markItemAsDelivered: async (deliveryId, itemId) => {
          set({ loading: true, error: null })
          try {
            const updated = await DeliveryService.markItemAsDelivered(deliveryId, itemId)
            if (!updated) {
              set({ error: 'Entrega não encontrada', loading: false })
              return null
            }

            set((state) => ({
              deliveries: state.deliveries.map((delivery) => (delivery.id === deliveryId ? updated : delivery)),
              selectedDelivery: state.selectedDelivery?.id === deliveryId ? updated : state.selectedDelivery,
              loading: false,
            }))
            void refreshSalesList()
            return updated
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao marcar item'), loading: false })
            return null
          }
        },

        markItemAsPending: async (deliveryId, itemId) => {
          set({ loading: true, error: null })
          try {
            const updated = await DeliveryService.markItemAsPending(deliveryId, itemId)
            if (!updated) {
              set({ error: 'Entrega não encontrada', loading: false })
              return null
            }

            set((state) => ({
              deliveries: state.deliveries.map((delivery) => (delivery.id === deliveryId ? updated : delivery)),
              selectedDelivery: state.selectedDelivery?.id === deliveryId ? updated : state.selectedDelivery,
              loading: false,
            }))
            void refreshSalesList()
            return updated
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao reverter item'), loading: false })
            return null
          }
        },

        completeDelivery: async (id) => {
          set({ loading: true, error: null })
          try {
            const updated = await DeliveryService.completeDelivery(id)
            if (!updated) {
              set({ error: 'Entrega não encontrada', loading: false })
              return null
            }

            set((state) => ({
              deliveries: state.deliveries.map((delivery) => (delivery.id === id ? updated : delivery)),
              selectedDelivery: state.selectedDelivery?.id === id ? updated : state.selectedDelivery,
              loading: false,
            }))
            void refreshSalesList()
            return updated
          } catch (error: unknown) {
            set({
              error: getErrorMessage(
                error,
                'Não foi possível concluir a entrega.'
              ),
              loading: false,
            })
            return null
          }
        },

        cancelDelivery: async (id) => {
          set({ loading: true, error: null })
          try {
            const updated = await DeliveryService.cancelDelivery(id)
            if (!updated) {
              set({ error: 'Entrega não encontrada', loading: false })
              return null
            }

            set((state) => ({
              deliveries: state.deliveries.map((delivery) => (delivery.id === id ? updated : delivery)),
              selectedDelivery: state.selectedDelivery?.id === id ? updated : state.selectedDelivery,
              loading: false,
            }))
            void refreshSalesList()
            return updated
          } catch (error: unknown) {
            set({ error: getErrorMessage(error, 'Erro ao cancelar entrega'), loading: false })
            return null
          }
        },

        reset: () =>
          set({
            deliveries: [],
            selectedDelivery: null,
            loading: false,
            error: null,
            search: '',
            filters: DEFAULT_DELIVERY_FILTERS,
            page: 1,
            pageSize: 10,
          }),
      })
    )
  )

export const useDeliveryStore = createStore()
