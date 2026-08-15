import type { EmployeeRole } from '@/lib/employees/employee-roles'

export interface Employee {
  id: string
  name: string
  role: EmployeeRole
  phone?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type NewEmployee = {
  name: string
  role: EmployeeRole
  phone?: string
  active: boolean
}

export type UpdateEmployee = Partial<NewEmployee>
