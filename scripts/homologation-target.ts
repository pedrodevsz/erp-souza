export const HOMOLOGATION_DATABASE = 'erp_souza_homolog' as const
export const HOMOLOGATION_CONFIRMATION = 'erp_souza_homolog' as const

export function validateHomologationUri(uri: string | undefined) {
  if (!uri) throw new Error('MONGODB_URI obrigatoria.')

  let parsed: URL
  try {
    parsed = new URL(uri)
  } catch {
    throw new Error('MONGODB_URI invalida.')
  }

  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) {
    throw new Error('Protocolo MongoDB invalido.')
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  if (database !== HOMOLOGATION_DATABASE) {
    throw new Error(`A URI deve declarar explicitamente o database ${HOMOLOGATION_DATABASE}.`)
  }
  if (parsed.searchParams.has('dbName')) {
    throw new Error('Remova dbName da query; o database deve ser definido somente no caminho da URI.')
  }

  return { database }
}

export function requireHomologationWriteConfirmation() {
  if (process.env.HOMOLOGATION_DATABASE_CONFIRMED !== HOMOLOGATION_CONFIRMATION) {
    throw new Error(`Defina HOMOLOGATION_DATABASE_CONFIRMED=${HOMOLOGATION_CONFIRMATION} somente apos confirmar a finalidade do database.`)
  }
}

export function redactMongoUri(message: string) {
  return message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, '<URI MongoDB redacted>')
}
