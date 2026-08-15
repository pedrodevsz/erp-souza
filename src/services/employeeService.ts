import { EmployeeApi, EmployeeApiError } from '@/lib/employees/employees-api'
import { DEFAULT_EMPLOYEE_ROLE, isEmployeeRole } from '@/lib/employees/employee-roles'
import type { Employee, NewEmployee, UpdateEmployee } from '@/types/employee'

type EmployeeApiShape = {
  id?: string
  name?: string
  role?: string
  phone?: string | null
  active?: boolean
  createdAt?: string
  updatedAt?: string
}

function normalizeEmployee(employee: EmployeeApiShape | null | undefined): Employee {
  return {
    id: employee?.id ?? '',
    name: employee?.name ?? '',
    role: employee?.role && isEmployeeRole(employee.role) ? employee.role : DEFAULT_EMPLOYEE_ROLE,
    phone: employee?.phone?.trim() || undefined,
    active: employee?.active ?? true,
    createdAt: employee?.createdAt ?? new Date().toISOString(),
    updatedAt: employee?.updatedAt ?? new Date().toISOString(),
  }
}

function normalizeError(error: unknown) {
  if (error instanceof EmployeeApiError) {
    return error
  }

  if (error instanceof Error) {
    return new Error(error.message)
  }

  return new Error('Erro inesperado.')
}

export const EmployeeService = {
  async getAll(): Promise<Employee[]> {
    const data = await EmployeeApi.getAll()
    return data.map((employee) => normalizeEmployee(employee))
  },

  async getById(id: string): Promise<Employee | null> {
    try {
      const employee = await EmployeeApi.getById(id)
      return normalizeEmployee(employee)
    } catch (error) {
      if (error instanceof EmployeeApiError && error.status === 404) return null
      throw normalizeError(error)
    }
  },

  async create(payload: NewEmployee): Promise<Employee> {
    try {
      const created = await EmployeeApi.create(payload)
      return normalizeEmployee(created)
    } catch (error) {
      throw normalizeError(error)
    }
  },

  async update(id: string, payload: UpdateEmployee): Promise<Employee | null> {
    try {
      const updated = await EmployeeApi.update(id, payload)
      return normalizeEmployee(updated)
    } catch (error) {
      if (error instanceof EmployeeApiError && error.status === 404) return null
      throw normalizeError(error)
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await EmployeeApi.delete(id)
      return true
    } catch (error) {
      if (error instanceof EmployeeApiError && error.status === 404) return false
      throw normalizeError(error)
    }
  },

  async toggleStatus(id: string): Promise<Employee | null> {
    try {
      const updated = await EmployeeApi.toggleStatus(id)
      return normalizeEmployee(updated)
    } catch (error) {
      if (error instanceof EmployeeApiError && error.status === 404) return null
      throw normalizeError(error)
    }
  },
}
