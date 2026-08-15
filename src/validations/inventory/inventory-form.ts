import { z } from 'zod'
import { normalizeTextInput } from '@/lib/text'

export const inventoryFormSchema = z
  .object({
    productName: z.string().min(2, 'Nome do produto é obrigatório').transform(normalizeTextInput),
    brand: z.string().min(1, 'Marca é obrigatória').transform(normalizeTextInput),
    product: z.string().optional().transform(normalizeTextInput),
    category: z.string().min(2, 'Categoria é obrigatória').transform(normalizeTextInput),
    unit: z.string().min(1, 'Unidade é obrigatória').transform(normalizeTextInput),
    costPrice: z.coerce.number().min(0, 'Preço de custo é obrigatório'),
    profitPercentage: z.coerce.number().min(0, 'Porcentagem de lucro é obrigatória'),
    salePrice: z.coerce.number().min(0, 'Preço de venda é obrigatório'),
    currentStock: z.coerce.number().int().min(0, 'Quantidade atual é obrigatória'),
    minimumStock: z.coerce.number().int().min(0, 'Estoque mínimo é obrigatório'),
    reservedStock: z.coerce.number().int().min(0, 'Estoque reservado é obrigatório'),
    supplier: z.string().min(2, 'Fornecedor é obrigatório').transform(normalizeTextInput),
    location: z.string().min(2, 'Localização é obrigatória').transform(normalizeTextInput),
    notes: z.string().optional().transform(normalizeTextInput),
  })
  .refine((data) => data.salePrice >= data.costPrice, {
    message: 'Preço de venda deve ser maior ou igual ao preço de custo',
    path: ['salePrice'],
  })
  .refine((data) => data.reservedStock <= data.currentStock, {
    message: 'Estoque reservado não pode ser maior que o estoque atual',
    path: ['reservedStock'],
  })

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>
