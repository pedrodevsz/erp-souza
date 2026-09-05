import { z } from 'zod'
import { normalizeTextInput } from '@/lib/text'

const productReservationFormBaseSchema = z.object({
  customerId: z.string().trim().min(1, 'Selecione um cliente.'),
  quantity: z.coerce.number().int('A quantidade deve ser um número inteiro.').min(1, 'A quantidade deve ser maior que zero.'),
  notes: z.string().optional().transform(normalizeTextInput),
})

export function buildProductReservationFormSchema(maxQuantity: number) {
  return productReservationFormBaseSchema.refine((data) => data.quantity <= maxQuantity, {
    message: 'A quantidade reservada não pode ser maior que a disponível.',
    path: ['quantity'],
  })
}

export type ProductReservationFormValues = z.infer<typeof productReservationFormBaseSchema>
