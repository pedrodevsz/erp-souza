import { useEffect, useMemo } from 'react'
import { useEmployeeStore } from '@/stores/useEmployeeStore'
import type { Employee } from '@/types/employee'

function sortByName(a: Employee, b: Employee) {
  return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
}

export function useSellerEmployees() {
  const employees = useEmployeeStore((state) => state.employees)
  const loading = useEmployeeStore((state) => state.loading)
  const error = useEmployeeStore((state) => state.error)
  const loadEmployees = useEmployeeStore((state) => state.loadEmployees)

  useEffect(() => {
    void loadEmployees()
  }, [loadEmployees])

  const sellerEmployees = useMemo(
    () => employees.filter((employee) => employee.active).slice().sort(sortByName),
    [employees]
  )

  return {
    sellerEmployees,
    loading,
    error,
    refresh: loadEmployees,
  } as const
}
