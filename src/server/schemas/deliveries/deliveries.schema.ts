import { z } from 'zod'
import { normalizeTextInput } from '@/lib/text'

const deliveryAddressSchema = z.object({
  street: z.string().trim().min(1, 'Rua é obrigatória.').transform(normalizeTextInput),
  number: z.string().trim().min(1, 'Número é obrigatório.').transform(normalizeTextInput),
  complement: z.string().trim().transform(normalizeTextInput).optional(),
  district: z.string().trim().min(1, 'Bairro é obrigatório.').transform(normalizeTextInput),
  city: z.string().trim().min(1, 'Cidade é obrigatória.').transform(normalizeTextInput),
  state: z.string().trim().min(2, 'Estado é obrigatório.').transform(normalizeTextInput),
})

const deliveryItemSchema = z.object({
  id: z.string().trim().min(1, 'Item inválido.'),
  productId: z.string().trim().min(1, 'Produto inválido.').transform(normalizeTextInput),
  productName: z.string().trim().min(1, 'Nome do produto é obrigatório.').transform(normalizeTextInput),
  sku: z.string().trim().min(1, 'SKU é obrigatório.').transform(normalizeTextInput),
  quantity: z.number().positive('Quantidade deve ser maior que zero.'),
  unit: z.string().trim().min(1, 'Unidade é obrigatória.').transform(normalizeTextInput),
  delivered: z.boolean(),
  deliveredAt: z.string().trim().optional(),
})

const deliveryBaseSchema = z.object({
  saleId: z.string().trim().min(1, 'Venda é obrigatória.'),
  saleNumber: z.string().trim().min(1, 'Número da venda é obrigatório.').transform(normalizeTextInput),
  customerId: z.string().trim().min(1, 'Cliente é obrigatório.'),
  customerName: z.string().trim().min(1, 'Nome do cliente é obrigatório.').transform(normalizeTextInput),
  customerPhone: z.string().trim().min(1, 'Telefone do cliente é obrigatório.').transform(normalizeTextInput),
  address: deliveryAddressSchema,
  scheduledDate: z.string().trim().min(1, 'Data agendada é obrigatória.'),
  deliveredAt: z.string().trim().optional(),
  status: z.enum(['PENDING', 'IN_ROUTE', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED', 'LATE']).optional(),
  driverName: z.string().trim().transform(normalizeTextInput).optional(),
  notes: z.string().trim().transform(normalizeTextInput).optional(),
  items: z.array(deliveryItemSchema).min(1, 'Adicione ao menos um item.'),
})

export const deliveryListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['PENDING', 'IN_ROUTE', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED', 'LATE']).optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  city: z.string().trim().optional(),
  driverName: z.string().trim().optional(),
})

export const deliveryIdParamSchema = z.object({
  id: z.string().trim().min(1, 'ID da entrega é obrigatório.'),
})

export const deliveryItemIdParamSchema = z.object({
  id: z.string().trim().min(1, 'ID da entrega é obrigatório.'),
  itemId: z.string().trim().min(1, 'ID do item é obrigatório.'),
})

export const deliveryUpdateSchema = deliveryBaseSchema.partial().strict().superRefine((data, ctx) => {
  if (Object.values(data).every((value) => value === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'Envie ao menos um campo para atualização.', path: [] })
  }
})

export type DeliveryListQuery = z.infer<typeof deliveryListQuerySchema>
export type DeliveryIdParam = z.infer<typeof deliveryIdParamSchema>
export type DeliveryItemIdParam = z.infer<typeof deliveryItemIdParamSchema>
export type UpdateDeliveryInput = z.infer<typeof deliveryUpdateSchema>

