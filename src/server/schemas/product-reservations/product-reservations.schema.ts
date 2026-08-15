import { z } from 'zod'

export const productReservationCreateSchema = z
  .object({
    productId: z.string().trim().min(1, 'Produto é obrigatório.'),
    customerId: z.string().trim().min(1, 'Cliente é obrigatório.'),
    quantity: z.coerce.number().int('A quantidade reservada deve ser um número inteiro.').min(1, 'A quantidade reservada deve ser maior que zero.'),
  })
  .strict()

export type CreateProductReservationInput = z.infer<typeof productReservationCreateSchema>
