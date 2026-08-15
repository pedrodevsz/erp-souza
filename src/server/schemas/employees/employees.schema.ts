import { z } from 'zod'
import { normalizeTextInput } from '@/lib/text'
import { EMPLOYEE_ROLES } from '@/lib/employees/employee-roles'

const employeePhoneSchema = z.string().trim().max(30).optional()
const employeeRoleSchema = z.enum(EMPLOYEE_ROLES)

const employeeBaseSchema = z.object({
  name: z.string().trim().min(1, 'Nome do funcionário é obrigatório.').transform(normalizeTextInput),
  role: employeeRoleSchema,
  phone: employeePhoneSchema,
  active: z.boolean().optional(),
})

export const employeeCreateSchema = employeeBaseSchema.strict()
export const employeeUpdateSchema = employeeBaseSchema.partial().strict().superRefine((data, ctx) => {
  if (Object.values(data).every((value) => value === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'Envie ao menos um campo para atualização.', path: [] })
  }
})

export const employeeListQuerySchema = z.object({
  search: z.string().trim().optional(),
})

export const employeeIdParamSchema = z.object({
  id: z.string().trim().min(1, 'ID do funcionário é obrigatório.'),
})

export type CreateEmployeeInput = z.infer<typeof employeeCreateSchema>
export type UpdateEmployeeInput = z.infer<typeof employeeUpdateSchema>
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>
export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>
