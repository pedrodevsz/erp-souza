import { z } from 'zod'
import { normalizeDocumentInput, normalizeTextInput } from '@/lib/text'

const customerAddressSchema = z.object({
  zipCode: z.string().trim().optional(),
  street: z.string().trim().transform(normalizeTextInput).optional(),
  number: z.string().trim().transform(normalizeTextInput).optional(),
  complement: z.string().trim().transform(normalizeTextInput).optional(),
  district: z.string().trim().transform(normalizeTextInput).optional(),
  city: z.string().trim().transform(normalizeTextInput).optional(),
  state: z.string().trim().transform(normalizeTextInput).optional(),
})

const customerBaseSchema = z.object({
  name: z.string().trim().min(2, 'Nome é obrigatório.').transform(normalizeTextInput),
  document: z.preprocess(
    (value: unknown) => {
      if (typeof value !== 'string') return value
      const normalized = normalizeDocumentInput(value)
      return normalized ? normalized : undefined
    },
    z.string().trim().min(3, 'CPF/CNPJ é obrigatório.').optional(),
  ),
  phone: z.string().trim().optional(),
  paymentReceived: z.boolean().default(false),
  paymentMethod: z.string().trim().transform(normalizeTextInput).optional(),
  addresses: z.array(customerAddressSchema).default([]),
  notes: z.string().trim().transform(normalizeTextInput).optional(),
})

function requirePaymentMethodIfReceived(data: {
  paymentReceived?: boolean
  paymentMethod?: string
}, ctx: z.RefinementCtx) {
  if (data.paymentReceived && !data.paymentMethod?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Selecione a forma de pagamento.',
      path: ['paymentMethod'],
    })
  }
}

export const customerCreateSchema = customerBaseSchema.strict().superRefine((data, ctx) => {
  requirePaymentMethodIfReceived(data, ctx)
})

export const customerUpdateSchema = customerBaseSchema.partial().strict().superRefine((data, ctx) => {
  if (Object.values(data).every((value) => value === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'Envie ao menos um campo para atualização.', path: [] })
  }

  requirePaymentMethodIfReceived(data, ctx)
})

export const customerListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
})

export const customerIdParamSchema = z.object({
  id: z.string().trim().min(1, 'ID do cliente é obrigatório.'),
})

export type CustomerAddressInput = z.infer<typeof customerAddressSchema>
export type CreateCustomerInput = z.infer<typeof customerCreateSchema>
export type UpdateCustomerInput = z.infer<typeof customerUpdateSchema>
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>
export type CustomerIdParam = z.infer<typeof customerIdParamSchema>

export const customerSchemas = {
  address: customerAddressSchema,
  base: customerBaseSchema,
}
