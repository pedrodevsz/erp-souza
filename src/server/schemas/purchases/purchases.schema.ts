import { z } from 'zod'
import { normalizePurchasePaymentCondition, MAX_PURCHASE_PAYMENT_CONDITIONS } from '@/lib/purchases'
import { normalizeTextInput } from '@/lib/text'

function normalizeDecimalValue(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.')
    if (!normalized) return value

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : value
  }

  return value
}

function normalizeTextValue(value: unknown) {
  if (typeof value === 'string') {
    return value.trim()
  }

  return value
}

const purchasePaymentConditionSchema = z.array(z.string().trim().transform(normalizeTextInput)).max(MAX_PURCHASE_PAYMENT_CONDITIONS).default([])

const purchasePaymentConditionInputSchema = z.preprocess((value) => normalizePurchasePaymentCondition(value as string | string[] | Record<string, unknown> | null | undefined), purchasePaymentConditionSchema)

const purchaseItemSchema = z.object({
  productId: z.string().trim().min(1, 'Produto inválido.').optional(),
  productName: z.string().trim().min(1, 'Nome do produto é obrigatório.').transform(normalizeTextInput),
  brand: z.string().trim().transform(normalizeTextInput).optional(),
  product: z.string().trim().transform(normalizeTextInput).optional(),
  category: z
    .preprocess((value) => (typeof value === 'string' ? value.trim().toLowerCase() : value), z.enum(['geral', 'hidraulico', 'eletrico', 'acabamento']).default('geral'))
    .transform(normalizeTextInput),
  quantity: z.preprocess(normalizeDecimalValue, z.number().positive('Quantidade deve ser maior que zero.')),
  unit: z.string().trim().min(1, 'Unidade é obrigatória.').transform(normalizeTextInput),
  unitPrice: z.preprocess(normalizeDecimalValue, z.number().min(0, 'Preço unitário inválido.')),
  profitPercentage: z.preprocess(normalizeDecimalValue, z.number().min(0, 'Percentual de lucro inválido.')).optional(),
  salePrice: z.preprocess(normalizeDecimalValue, z.number().min(0, 'Preço de venda inválido.')).optional(),
  discount: z.preprocess(normalizeDecimalValue, z.number().min(0)).default(0),
})

const purchaseBaseSchema = z.object({
  supplier: z.string().trim().min(2, 'Fornecedor é obrigatório.').transform(normalizeTextInput),
  purchaseDate: z.string().trim().min(1, 'Data da compra é obrigatória.'),
  expectedDelivery: z.preprocess(normalizeTextValue, z.string().trim().transform(normalizeTextInput).nullable().optional()),
  paymentCondition: purchasePaymentConditionInputSchema,
  paymentMethod: z.preprocess(normalizeTextValue, z.string().trim().transform(normalizeTextInput).nullable().optional()),
  invoiceNumber: z.preprocess(normalizeTextValue, z.string().trim().transform(normalizeTextInput).nullable().optional()),
  notes: z.preprocess(normalizeTextValue, z.string().trim().transform(normalizeTextInput).optional()),
  discounts: z.preprocess(normalizeDecimalValue, z.number().min(0)).default(0),
  freight: z.preprocess(normalizeDecimalValue, z.number().min(0)).default(0),
  otherExpenses: z.preprocess(normalizeDecimalValue, z.number().min(0)).default(0),
  items: z.array(purchaseItemSchema).min(1, 'Adicione ao menos um item.'),
})

export const purchaseCreateSchema = purchaseBaseSchema.strict()

export const purchaseUpdateSchema = purchaseBaseSchema.partial().strict().superRefine((data, ctx) => {
  if (Object.values(data).every((value) => value === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'Envie ao menos um campo para atualização.', path: [] })
  }
})

export const purchaseListQuerySchema = z.object({
  search: z.string().trim().optional(),
})

export const purchaseIdParamSchema = z.object({
  id: z.string().trim().min(1, 'ID da compra é obrigatório.'),
})

export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>
export type CreatePurchaseInput = z.infer<typeof purchaseCreateSchema>
export type UpdatePurchaseInput = z.infer<typeof purchaseUpdateSchema>
export type PurchaseListQuery = z.infer<typeof purchaseListQuerySchema>
export type PurchaseIdParam = z.infer<typeof purchaseIdParamSchema>

export const purchaseSchemas = {
  base: purchaseBaseSchema,
  item: purchaseItemSchema,
  paymentCondition: purchasePaymentConditionSchema,
}
