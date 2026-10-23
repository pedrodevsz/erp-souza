import { loadEnvConfig } from '@next/env'
import mongoose from 'mongoose'

import { normalizeTextInput } from '../src/lib/text'
import { hashPassword } from '../src/server/auth/password'
import { UserModel } from '../src/server/models/users/users.model'
import { passwordSchema } from '../src/server/schemas/auth/auth.schema'
import { SINGLE_STORE_ID } from '../src/server/store/constants'
import { redactMongoUri, requireHomologationWriteConfirmation, validateHomologationUri } from './homologation-target'

loadEnvConfig(process.cwd())

async function main() {
  if (process.env.APP_ENV !== 'homologation') throw new Error('APP_ENV=homologation obrigatorio.')
  requireHomologationWriteConfirmation()
  const uri = process.env.MONGODB_URI
  validateHomologationUri(uri)

  const username = normalizeTextInput(process.env.HOMOLOG_ADMIN_USERNAME ?? '')
  if (!username || username.length > 120) throw new Error('HOMOLOG_ADMIN_USERNAME invalido.')
  const password = passwordSchema.parse(process.env.HOMOLOG_ADMIN_PASSWORD)

  await mongoose.connect(uri!, { bufferCommands: false, autoIndex: false })
  try {
    const existing = await UserModel.findOne({ username }).select({ _id: 1 }).lean()
    if (existing) throw new Error('O username de homologacao ja existe; nenhuma credencial foi alterada.')

    const created = await UserModel.create({
      username,
      passwordHash: await hashPassword(password),
      storeId: SINGLE_STORE_ID,
      role: 'ADMIN',
      isActive: true,
    })
    console.log(JSON.stringify({ created: true, userId: String(created._id), role: created.role, storeId: created.storeId }))
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(redactMongoUri(error instanceof Error ? error.message : 'Falha ao criar administrador de homologacao.'))
  process.exitCode = 1
})
