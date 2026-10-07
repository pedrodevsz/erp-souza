import type { Db } from 'mongodb'

export const INTEGRATION_TEST_DATABASE = 'erp_souza_integration_test'
export const INTEGRATION_MARKER_COLLECTION = '_erp_integration_runner'

export function validateMongoTestTarget(uri: string | undefined, developmentUri?: string) {
  if (!uri) throw new Error('MONGODB_TEST_URI e obrigatoria; MONGODB_URI nao sera usada como fallback.')
  if (developmentUri && uri === developmentUri) throw new Error('MONGODB_TEST_URI nao pode ser igual a MONGODB_URI.')

  let parsed: URL
  try {
    parsed = new URL(uri)
  } catch {
    throw new Error('MONGODB_TEST_URI invalida.')
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) throw new Error('Protocolo MongoDB invalido.')
  if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) throw new Error('Testes de integracao aceitam somente MongoDB local descartavel.')
  if (database !== INTEGRATION_TEST_DATABASE) throw new Error(`Database de teste deve ser exatamente ${INTEGRATION_TEST_DATABASE}.`)
  if (parsed.searchParams.get('replicaSet') !== 'rs0' || parsed.searchParams.get('directConnection') !== 'true') {
    throw new Error('MongoDB de teste deve identificar replicaSet=rs0 e directConnection=true.')
  }

  return { host: parsed.hostname, database }
}

export function validateDestructiveMongoTestTarget(uri: string | undefined, runId: string | undefined, developmentUri?: string) {
  const target = validateMongoTestTarget(uri, developmentUri)
  if (!runId || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(runId)) {
    throw new Error('ERP_INTEGRATION_RUN_ID valido e obrigatorio para testes destrutivos.')
  }
  return { ...target, runId }
}

export async function assertDisposableMongoMarker(db: Db, runId: string) {
  const marker = await db.collection<{ _id: string; runId: string }>(INTEGRATION_MARKER_COLLECTION).findOne({
    _id: 'container-runner',
    runId,
  })
  if (!marker) throw new Error('Marcador do container descartavel nao foi encontrado; operacao destrutiva recusada.')
}
