import { z } from 'zod'
import { normalizeSalePaymentConditionType } from '@/lib/sales'
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

const saleItemSchema = z.object({
  productId: z.string().trim().min(1, 'Produto inválido.'),
  productName: z.string().trim().min(1, 'Nome do produto é obrigatório.').transform(normalizeTextInput),
  brand: z.string().trim().transform(normalizeTextInput).optional(),
  product: z.string().trim().transform(normalizeTextInput).optional(),
  sku: z.string().trim().min(1, 'SKU é obrigatório.').transform(normalizeTextInput),
  unit: z.string().trim().min(1, 'Unidade é obrigatória.').transform(normalizeTextInput),
  quantity: z.preprocess(normalizeDecimalValue, z.number().positive('Quantidade deve ser maior que zero.')),
  availableStock: z.preprocess(normalizeDecimalValue, z.number().min(0, 'Estoque disponível inválido.')),
  unitPrice: z.preprocess(normalizeDecimalValue, z.number().min(0, 'Preço unitário inválido.')),
  discount: z.preprocess(normalizeDecimalValue, z.number().min(0)).default(0),
})

const saleInstallmentSchema = z.object({
  id: z.string().trim().optional(),
  number: z.preprocess(normalizeDecimalValue, z.number().int().positive('Número da parcela é obrigatório.')),
  amount: z.preprocess(normalizeDecimalValue, z.number().positive('Valor da parcela é obrigatório.')),
  paymentMethod: z.string().trim().min(1, 'Selecione a forma de pagamento da parcela.').transform(normalizeTextInput),
  dueDate: z.preprocess(normalizeTextValue, z.string().trim().transform(normalizeTextInput).optional()),
  status: z.string().trim().transform(normalizeTextInput).optional(),
})

const salePaymentSchema = z.object({
  id: z.string().trim().optional(),
  amount: z.preprocess(normalizeDecimalValue, z.number().positive('Valor do pagamento é obrigatório.')),
  date: z.string().trim().min(1, 'Data do pagamento é obrigatória.').transform(normalizeTextInput),
  paymentMethod: z.string().trim().transform(normalizeTextInput).default(''),
  notes: z.string().trim().transform(normalizeTextInput).optional(),
})

const salePaymentConditionSchema = z.object({
  type: z.preprocess(
    normalizeTextValue,
    z.string().trim().min(1, 'Selecione a condição de pagamento.').transform((value) => normalizeSalePaymentConditionType(value))
  ),
  installments: z.array(saleInstallmentSchema).optional(),
})

const saleBaseSchema = z.object({
  customerId: z.string().trim().min(1, 'Selecione um cliente.'),
  customerName: z.string().trim().min(1, 'Nome do cliente é obrigatório.').transform(normalizeTextInput),
  sellerId: z.string().trim().min(1, 'Selecione um vendedor.'),
  sellerName: z.string().trim().min(1, 'Nome do vendedor é obrigatório.').transform(normalizeTextInput),
  saleDate: z.string().trim().min(1, 'Data da venda é obrigatória.'),
  isDelivery: z.boolean(),
  deliveryDate: z.string().trim().optional(),
  paymentMethod: z.preprocess(normalizeTextValue, z.string().trim().transform(normalizeTextInput).optional()),
  initialPayment: z.preprocess(
    normalizeDecimalValue,
    z.number().min(0, 'Informe um valor maior ou igual a zero para a primeira parcela.').optional()
  ),
  paymentCondition: z.preprocess((value) => {
    if (typeof value === 'string') {
      return { type: value }
    }

    return value
  }, salePaymentConditionSchema),
  payments: z.array(salePaymentSchema).default([]),
  notes: z.string().trim().transform(normalizeTextInput).optional(),
  subtotal: z.preprocess(normalizeDecimalValue, z.number().min(0).optional()),
  discount: z.preprocess(normalizeDecimalValue, z.number().min(0)).default(0),
  shipping: z.preprocess(normalizeDecimalValue, z.number().min(0)).default(0),
  otherCosts: z.preprocess(normalizeDecimalValue, z.number().min(0)).default(0),
  items: z.array(saleItemSchema).min(1, 'Adicione ao menos um item.'),
})

function requirePaymentMethodForAVista(
  data: {
    paymentCondition?: { type?: string; installments?: Array<{ amount?: number }> }
    paymentMethod?: string
  },
  ctx: z.RefinementCtx
) {
  if (data.paymentCondition?.type !== 'A_VISTA') {
    return
  }

  if (!data.paymentMethod?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Selecione a forma de pagamento.',
      path: ['paymentMethod'],
    })
  }
}

function validatePaymentConditionPayments(
  data: {
    paymentCondition?: { type?: string; installments?: Array<{ number?: number; amount?: number; paymentMethod?: string; status?: string; dueDate?: string }> }
    initialPayment?: number
    payments?: Array<{ amount?: number; date?: string }>
    total?: number
  },
  ctx: z.RefinementCtx
) {
  const paymentCondition = data.paymentCondition
  if (!paymentCondition?.type) {
    return
  }

  if (paymentCondition.type === 'A_VISTA') {
    if ((paymentCondition.installments ?? []).length > 0 || (data.payments ?? []).length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Não é permitido criar pagamentos adicionais em venda à vista.',
        path: ['payments'],
      })
    }
    return
  }

  const initialPayment = Number(data.initialPayment ?? 0)
  if (!Number.isFinite(initialPayment) || initialPayment < 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe um valor maior ou igual a zero para a primeira parcela.',
      path: ['initialPayment'],
    })
    return
  }

  const installmentCount = (paymentCondition.installments ?? []).length
  if (initialPayment > 0 && installmentCount > 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Não utilize parcelas fixas na nova venda. Registre apenas pagamentos reais.',
      path: ['paymentCondition', 'installments'],
    })
  }
}

export const saleCreateSchema = saleBaseSchema.extend({
  isDelivery: z.boolean().default(false),
}).strict().superRefine((data, ctx) => {
  requirePaymentMethodForAVista(data, ctx)
  validatePaymentConditionPayments(data, ctx)
})

export const saleUpdateSchema = saleBaseSchema.partial().strict().superRefine((data, ctx) => {
  if (Object.values(data).every((value) => value === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'Envie ao menos um campo para atualização.', path: [] })
  }

  requirePaymentMethodForAVista(data, ctx)
  validatePaymentConditionPayments(data, ctx)
})

export const saleListQuerySchema = z.object({
  search: z.string().trim().optional(),
  deliveryStatus: z.enum(['PENDING', 'DELIVERED']).optional(),
  paymentMethod: z.string().trim().optional(),
})

export const saleIdParamSchema = z.object({
  id: z.string().trim().min(1, 'ID da venda é obrigatório.'),
})

export type CreateSaleInput = z.infer<typeof saleCreateSchema>
export type UpdateSaleInput = z.infer<typeof saleUpdateSchema>
export type SaleListQuery = z.infer<typeof saleListQuerySchema>
export type SaleIdParam = z.infer<typeof saleIdParamSchema>
