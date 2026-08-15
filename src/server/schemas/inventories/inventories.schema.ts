import { z } from 'zod'
import { normalizeTextInput } from '@/lib/text'

const inventoryFieldsSchema = z.object({
  productId: z.string().trim().min(1).optional(),
  productName: z.string().trim().min(2, 'Nome do produto é obrigatório.').transform(normalizeTextInput),
  brand: z.string().trim().min(1, 'Marca é obrigatória.').transform(normalizeTextInput),
  product: z.string().trim().transform(normalizeTextInput).optional(),
  sku: z.string().trim().transform(normalizeTextInput).optional(),
  category: z.string().trim().min(2, 'Categoria é obrigatória.').transform(normalizeTextInput),
  unit: z.string().trim().min(1, 'Unidade é obrigatória.').transform(normalizeTextInput),
  costPrice: z.coerce.number().min(0, 'Preço de custo é obrigatório.'),
  profitPercentage: z.coerce.number().min(0, 'Porcentagem de lucro é obrigatória.'),
  salePrice: z.coerce.number().min(0, 'Preço de venda é obrigatório.'),
  currentStock: z.coerce.number().int().min(0, 'Quantidade atual é obrigatória.'),
  minimumStock: z.coerce.number().int().min(0, 'Estoque mínimo é obrigatório.'),
  reservedStock: z.coerce.number().int().min(0, 'Estoque reservado é obrigatório.'),
  location: z.string().trim().min(2, 'Localização é obrigatória.').transform(normalizeTextInput),
  supplier: z.string().trim().min(2, 'Fornecedor é obrigatório.').transform(normalizeTextInput),
  lastEntryDate: z.string().trim().optional(),
  lastOutputDate: z.string().trim().optional(),
  notes: z.string().trim().transform(normalizeTextInput).optional(),
})

export const inventoryCreateSchema = inventoryFieldsSchema
  .strict()
  .refine((data) => data.salePrice >= data.costPrice, {
    message: 'Preço de venda deve ser maior ou igual ao preço de custo.',
    path: ['salePrice'],
  })
  .refine((data) => data.reservedStock <= data.currentStock, {
    message: 'Estoque reservado não pode ser maior que o estoque atual.',
    path: ['reservedStock'],
  })

export const inventoryUpdateSchema = inventoryFieldsSchema
  .partial()
  .strict()
  .refine((data) => data.salePrice === undefined || data.costPrice === undefined || data.salePrice >= data.costPrice, {
    message: 'Preço de venda deve ser maior ou igual ao preço de custo.',
    path: ['salePrice'],
  })
  .refine(
    (data) =>
      data.reservedStock === undefined || data.currentStock === undefined || data.reservedStock <= data.currentStock,
    {
      message: 'Estoque reservado não pode ser maior que o estoque atual.',
      path: ['reservedStock'],
    }
  )

export const inventoryListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
})

export const inventoryMovementListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

export type CreateInventoryInput = z.infer<typeof inventoryCreateSchema>
export type UpdateInventoryInput = z.infer<typeof inventoryUpdateSchema>
export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>
export type InventoryMovementListQuery = z.infer<typeof inventoryMovementListQuerySchema>
