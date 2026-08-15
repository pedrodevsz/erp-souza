export const EMPLOYEE_ROLES = ['Vendedor', 'Gerente', 'Dono', 'Subgerente', 'Auxiliar', 'Entregador'] as const

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number]

export const DEFAULT_EMPLOYEE_ROLE: EmployeeRole = 'Vendedor'

export function isEmployeeRole(value: string): value is EmployeeRole {
  return (EMPLOYEE_ROLES as readonly string[]).includes(value)
}
