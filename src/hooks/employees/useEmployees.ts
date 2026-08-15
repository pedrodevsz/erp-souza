import { useCallback, useEffect, useMemo } from 'react'
import { useEmployeeStore } from '@/stores/useEmployeeStore'
import type { Employee } from '@/types/employee'

function matchesEmployeeSearch(employee: Employee, search: string) {
  const query = search.trim().toLowerCase()
  if (!query) return true

  return (
    employee.name.toLowerCase().includes(query) ||
    employee.role.toLowerCase().includes(query) ||
    employee.phone?.toLowerCase().includes(query) ||
    employee.id.toLowerCase().includes(query)
  )
}

export function useEmployees() {
  const employees = useEmployeeStore((state) => state.employees)
  const selectedEmployee = useEmployeeStore((state) => state.selectedEmployee)
  const loading = useEmployeeStore((state) => state.loading)
  const error = useEmployeeStore((state) => state.error)
  const search = useEmployeeStore((state) => state.search)
  const page = useEmployeeStore((state) => state.page)
  const pageSize = useEmployeeStore((state) => state.pageSize)

  const loadEmployees = useEmployeeStore((state) => state.loadEmployees)
  const createEmployee = useEmployeeStore((state) => state.createEmployee)
  const updateEmployee = useEmployeeStore((state) => state.updateEmployee)
  const deleteEmployee = useEmployeeStore((state) => state.deleteEmployee)
  const findEmployeeById = useEmployeeStore((state) => state.findEmployeeById)
  const toggleEmployeeStatus = useEmployeeStore((state) => state.toggleEmployeeStatus)
  const selectEmployee = useEmployeeStore((state) => state.selectEmployee)
  const clearSelectedEmployee = useEmployeeStore((state) => state.clearSelectedEmployee)
  const setSearch = useEmployeeStore((state) => state.setSearch)
  const setPage = useEmployeeStore((state) => state.setPage)
  const reset = useEmployeeStore((state) => state.reset)

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  const filteredEmployees = useMemo(() => employees.filter((employee) => matchesEmployeeSearch(employee, search)), [employees, search])
  const activeEmployees = useMemo(() => filteredEmployees.filter((employee) => employee.active), [filteredEmployees])

  const total = filteredEmployees.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEmployees.slice(start, start + pageSize)
  }, [currentPage, filteredEmployees, pageSize])

  const refresh = useCallback(() => loadEmployees(), [loadEmployees])

  return {
    employees: paginatedEmployees,
    allEmployees: employees,
    activeEmployees,
    selectedEmployee,
    loading,
    error,
    search,
    page,
    currentPage,
    pageSize,
    total,
    totalPages,
    loadEmployees: refresh,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    findEmployeeById,
    toggleEmployeeStatus,
    selectEmployee,
    clearSelectedEmployee,
    setSearch,
    setPage,
    reset,
  } as const
}
