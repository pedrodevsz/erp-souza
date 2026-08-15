import { z } from 'zod'
import { normalizeTextInput } from '@/lib/text'

const productBaseSchema = z.object({
  name: z.string().trim().min(2, 'Nome do produto é obrigatório.').transform(normalizeTextInput),
  unit: z.string().trim().min(1, 'Unidade é obrigatória.').transform(normalizeTextInput),
  brand: z.string().trim().min(1, 'Marca é obrigatória.').transform(normalizeTextInput),
})

export const productCreateSchema = productBaseSchema.strict()
export const productListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
})

export type CreateProductInput = z.infer<typeof productCreateSchema>
export type ProductListQuery = z.infer<typeof productListQuerySchema>
