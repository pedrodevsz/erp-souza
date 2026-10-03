export type MigrationTarget = 'rehearsal' | 'production'

export type MigrationAuthorization = {
  target: MigrationTarget
  database: string
  backupConfirmed: boolean
  rehearsalConfirmed: boolean
  approvalNote: string
}

export type MigrationBlockers = {
  supplierConflicts: unknown[]
  missingSaleProductReferences: unknown[]
  divergentStores: unknown[]
}

const confirmations: Record<MigrationTarget, string> = {
  rehearsal: 'APPLY_STORE_SCOPE_TO_DISPOSABLE_REHEARSAL',
  production: 'APPLY_STORE_SCOPE_TO_PRODUCTION_AFTER_BACKUP_AND_REHEARSAL',
}

export function assertMigrationAuthorized(input: {
  target: MigrationTarget
  database: string
  confirmation: string
  authorization: MigrationAuthorization
  blockers: MigrationBlockers
}) {
  const { target, database, confirmation, authorization, blockers } = input
  const unresolved = Object.values(blockers).reduce((count, entries) => count + entries.length, 0)
  if (unresolved > 0) throw new Error(`Apply bloqueado: ${unresolved} pendencia(s) precisam de decisao humana.`)
  if (authorization.target !== target || authorization.database !== database) throw new Error('Autorizacao nao corresponde ao destino solicitado.')
  if (!authorization.approvalNote?.trim()) throw new Error('Autorizacao precisa de nota rastreavel.')
  if (!authorization.backupConfirmed) throw new Error('Backup restauravel precisa ser confirmado antes do apply.')
  if (target === 'production' && !authorization.rehearsalConfirmed) throw new Error('Rehearsal aprovado e obrigatorio antes do apply de producao.')
  if (confirmation !== confirmations[target]) throw new Error(`Confirmacao forte invalida para ${target}.`)
}

export function assertAuthorizedUsers(users: Array<{ _id: unknown; isActive?: boolean; role?: string; storeId?: unknown }>, expectedIds: string[], canonicalStoreId: string) {
  const expected = new Set(expectedIds)
  if (expected.size !== expectedIds.length) throw new Error('Usuarios autorizados duplicados nas decisoes.')
  if (users.length !== expected.size) throw new Error('Um ou mais usuarios autorizados nao foram encontrados.')
  for (const user of users) {
    if (!user.isActive || !['ADMIN', 'USER'].includes(user.role ?? '')) throw new Error('Usuario autorizado precisa estar ativo e possuir papel permitido.')
    if (user.storeId != null && user.storeId !== canonicalStoreId) throw new Error('Usuario autorizado ja pertence a outra loja.')
  }
}

export function assertMatchedCount(actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`Quantidade atualizada divergente: esperado ${expected}, encontrado ${actual}.`)
  }
}
