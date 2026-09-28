import { z } from 'zod'

import { normalizeTextInput } from '@/lib/text'
import { passwordSchema } from '@/server/schemas/auth/auth.schema'

const usernameSchema = z
  .string()
  .trim()
  .min(1, 'Username é obrigatório.')
  .max(120, 'Username deve ter no máximo 120 caracteres.')
  .transform(normalizeTextInput)

export const userCreateSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
}).strict()

export const userUpdateSchema = z.object({
  password: passwordSchema.optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => value.password !== undefined || value.isActive !== undefined, {
  message: 'Informe password ou isActive para atualizar o usuário.',
})

export const userIdParamSchema = z.object({
  id: z.string().min(1, 'ID do usuário é obrigatório.'),
})

export type UserCreateInput = z.infer<typeof userCreateSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
