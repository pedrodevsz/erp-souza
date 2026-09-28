import { z } from 'zod'

import { normalizeTextInput } from '@/lib/text'

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter entre 8 e 128 caracteres.')
  .max(128, 'A senha deve ter entre 8 e 128 caracteres.')

export const authLoginSchema = z.object({
  username: z.string().trim().min(1, 'Nome de usuário é obrigatório.').transform(normalizeTextInput),
  password: passwordSchema,
}).strict()

export type AuthLoginInput = z.infer<typeof authLoginSchema>
