import { z } from 'zod'

import { normalizeTextInput } from '@/lib/text'

const numericPasswordSchema = z
  .string()
  .trim()
  .min(1, 'A senha numérica deve ter ao menos 1 dígito.')
  .max(12, 'A senha numérica deve ter no máximo 12 dígitos.')
  .regex(/^\d+$/, 'A senha deve conter apenas números.')

export const authLoginSchema = z.object({
  name: z.string().trim().min(1, 'Nome do usuário é obrigatório.').transform(normalizeTextInput),
  password: numericPasswordSchema,
})

export type AuthLoginInput = z.infer<typeof authLoginSchema>
