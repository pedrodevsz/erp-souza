import { z } from 'zod'
import { normalizeTextInput } from '@/lib/text'

export const inventoryCategoryCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nome da categoria é obrigatório.').transform(normalizeTextInput),
})

export type CreateInventoryCategoryInput = z.infer<typeof inventoryCategoryCreateSchema>
