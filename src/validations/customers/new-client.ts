import { z } from 'zod'
import { normalizeDocumentInput, normalizeTextInput } from '@/lib/text'

const customerAddressSchema = z.object({
  zipCode: z.string().optional(),
  street: z.string().optional().transform(normalizeTextInput),
  number: z.string().optional().transform(normalizeTextInput),
  complement: z.string().optional().transform(normalizeTextInput),
  district: z.string().optional().transform(normalizeTextInput),
  city: z.string().optional().transform(normalizeTextInput),
  state: z.string().optional().transform(normalizeTextInput),
})

export const customerSchema = z
  .object({
    fullName: z.string().min(2, 'Nome é obrigatório').transform(normalizeTextInput),
    document: z.preprocess((value) => {
      const normalized = normalizeDocumentInput(typeof value === 'string' ? value : '')
      return normalized ? normalized : undefined
    }, z.string().min(3, 'CPF / CNPJ é obrigatório').optional()),
    phone: z.string().optional(),
    addresses: z.array(customerAddressSchema).default([]),
    notes: z.string().optional().transform(normalizeTextInput),
  })

export type CustomerFormValues = z.infer<typeof customerSchema>

export const customerSchemas = {
  addresses: customerAddressSchema,
  base: customerSchema,
}
