import { z } from 'zod'
import { normalizeTextInput } from '@/lib/text'

const supplierBaseSchema = z.object({
  name: z.string().trim().min(2, 'Nome do fornecedor é obrigatório.').transform(normalizeTextInput),
})

export const supplierCreateSchema = supplierBaseSchema.strict()
export const supplierListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
})

export type CreateSupplierInput = z.infer<typeof supplierCreateSchema>
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>
