import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { EmployeeService } from '@/services/employeeService'
import type { Employee, NewEmployee, UpdateEmployee } from '@/types/employee'

type State = {
  employees: Employee[]
  selectedEmployee: Employee | null
  loading: boolean
  error: string | null
  search: string
  page: number
  pageSize: number
}

type Actions = {
  loadEmployees: () => Promise<void>
  createEmployee: (data: NewEmployee) => Promise<Employee | null>
  updateEmployee: (id: string, data: UpdateEmployee) => Promise<Employee | null>
  deleteEmployee: (id: string) => Promise<boolean>
  findEmployeeById: (id: string) => Promise<Employee | null>
  toggleEmployeeStatus: (id: string) => Promise<Employee | null>
  selectEmployee: (id: string | null) => void
  clearSelectedEmployee: () => void
  setSearch: (value: string) => void
  setPage: (page: number) => void
  reset: () => void
}

const DEFAULT_STATE = {
  employees: [],
  selectedEmployee: null,
  loading: false,
  error: null,
  search: '',
  page: 1,
  pageSize: 10,
}

const createStore = () =>
  create<State & Actions>()(
    devtools(
      (set, get) => ({
        ...DEFAULT_STATE,

        loadEmployees: async () => {
          set({ loading: true, error: null })
          try {
            const employees = await EmployeeService.getAll()
            set({ employees, loading: false, error: null })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro ao carregar funcionários.',
              loading: false,
            })
          }
        },

        createEmployee: async (data) => {
          set({ loading: true, error: null })
          try {
            const created = await EmployeeService.create(data)
            await get().loadEmployees()
            return created
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro ao criar funcionário.',
              loading: false,
            })
            return null
          }
        },

        updateEmployee: async (id, data) => {
          set({ loading: true, error: null })
          try {
            const updated = await EmployeeService.update(id, data)
            await get().loadEmployees()
            return updated
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro ao atualizar funcionário.',
              loading: false,
            })
            return null
          }
        },

        deleteEmployee: async (id) => {
          set({ loading: true, error: null })
          try {
            const deleted = await EmployeeService.delete(id)
            if (deleted) {
              await get().loadEmployees()
            } else {
              set({ loading: false })
            }
            return deleted
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro ao excluir funcionário.',
              loading: false,
            })
            return false
          }
        },

        findEmployeeById: async (id) => {
          set({ loading: true, error: null })
          try {
            const cached = get().employees.find((employee) => employee.id === id) ?? null
            const found = cached ?? (await EmployeeService.getById(id))
            set({ loading: false })
            return found
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro ao buscar funcionário.',
              loading: false,
            })
            return null
          }
        },

        toggleEmployeeStatus: async (id) => {
          set({ loading: true, error: null })
          try {
            const updated = await EmployeeService.toggleStatus(id)
            await get().loadEmployees()
            return updated
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erro ao alterar status do funcionário.',
              loading: false,
            })
            return null
          }
        },

        selectEmployee: (id) => {
          if (!id) {
            set({ selectedEmployee: null })
            return
          }

          const selectedEmployee = get().employees.find((employee) => employee.id === id) ?? null
          set({ selectedEmployee })
        },

        clearSelectedEmployee: () => set({ selectedEmployee: null }),

        setSearch: (value) => set({ search: value, page: 1 }),

        setPage: (page) => set({ page }),

        reset: () => set(DEFAULT_STATE),
      }),
      { name: 'useEmployeeStore' }
    )
  )

export const useEmployeeStore = createStore()
