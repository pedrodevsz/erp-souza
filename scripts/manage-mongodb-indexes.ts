import { createHash } from 'node:crypto'
import { loadEnvConfig } from '@next/env'
import { MongoClient, type Db, type IndexDescriptionInfo } from 'mongodb'

import { assertDisposableMongoMarker, validateDestructiveMongoTestTarget } from '../tests/helpers/mongodb-test-target'
import { INDEX_PLAN_COLLECTIONS, MONGODB_INDEX_PLAN, type PlannedIndex } from './mongodb-index-plan'

loadEnvConfig(process.cwd())

type Target = 'rehearsal' | 'production'

function parseArgs(args: string[]) {
  const values = new Map<string, string>()
  let apply = false
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--apply') {
      apply = true
      continue
    }
    if (!['--database', '--uri-env', '--target', '--confirm', '--snapshot-evidence'].includes(arg)) {
      throw new Error(`Argumento nao suportado: ${arg}`)
    }
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Valor ausente para ${arg}.`)
    values.set(arg, value)
    index += 1
  }
  const database = values.get('--database')
  if (!database) throw new Error('--database explicito e obrigatorio.')
  const uriEnv = values.get('--uri-env') ?? 'MONGODB_URI'
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(uriEnv)) throw new Error('--uri-env invalido.')
  const target = values.get('--target') as Target | undefined
  if (apply && target !== 'rehearsal' && target !== 'production') throw new Error('--target rehearsal|production e obrigatorio com --apply.')
  return { apply, database, uriEnv, target, confirm: values.get('--confirm'), snapshotEvidence: values.get('--snapshot-evidence') }
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${key}:${stable(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function definition(entry: PlannedIndex | IndexDescriptionInfo) {
  const key = 'keys' in entry ? entry.keys : entry.key
  const source = 'options' in entry ? entry.options : entry
  return stable({
    key,
    unique: Boolean(source.unique),
    sparse: Boolean(source.sparse),
    partialFilterExpression: source.partialFilterExpression ?? null,
  })
}

function safeId(value: unknown) {
  return `id:${createHash('sha256').update(String(value)).digest('hex').slice(0, 14)}`
}

export async function auditUniqueCollisions(db: Db) {
  const reports = []
  for (const entry of MONGODB_INDEX_PLAN.filter((item) => item.options.unique)) {
    const match = entry.options.partialFilterExpression ? [{ $match: entry.options.partialFilterExpression }] : []
    const groupId = Object.fromEntries(Object.keys(entry.keys).map((field) => [field, `$${field}`]))
    const [summary] = await db.collection(entry.collection).aggregate([
      ...match,
      { $group: { _id: groupId, ids: { $push: '$_id' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $project: { _id: 0, ids: 1, count: 1 } },
      { $group: { _id: null, groups: { $sum: 1 }, documents: { $sum: '$count' }, samples: { $push: '$ids' } } },
    ]).toArray()
    const documentsAnalyzed = await db.collection(entry.collection).countDocuments(entry.options.partialFilterExpression ?? {})
    const projection = Object.fromEntries(Object.keys(entry.keys).map((field) => [field, 1]))
    const documents = await db.collection(entry.collection).find(entry.options.partialFilterExpression ?? {}, { projection }).toArray()
    const normalizedGroups = new Map<string, unknown[]>()
    for (const document of documents) {
      const normalizedKey = stable(Object.fromEntries(Object.keys(entry.keys).map((field) => {
        const value = document[field]
        return [field, typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR') : value]
      })))
      normalizedGroups.set(normalizedKey, [...(normalizedGroups.get(normalizedKey) ?? []), document._id])
    }
    const normalizedConflicts = [...normalizedGroups.values()].filter((ids) => ids.length > 1)
    reports.push({
      collection: entry.collection,
      index: entry.name,
      documentsAnalyzed,
      conflictingGroups: summary?.groups ?? 0,
      conflictingDocuments: summary?.documents ?? 0,
      sampleDocumentIds: (summary?.samples ?? []).slice(0, 5).map((ids: unknown[]) => ids.map(safeId)),
      normalizedConflictingGroups: normalizedConflicts.length,
      normalizedSampleDocumentIds: normalizedConflicts.slice(0, 5).map((ids) => ids.map(safeId)),
    })
  }
  return reports
}

export async function inspectIndexPlan(db: Db) {
  const existingCollections = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name))
  const collections = []
  for (const collection of INDEX_PLAN_COLLECTIONS) {
    const actual = existingCollections.has(collection) ? await db.collection(collection).listIndexes().toArray() : []
    const expected = MONGODB_INDEX_PLAN.filter((entry) => entry.collection === collection)
    const rows = expected.map((entry) => {
      const byName = actual.find((item) => item.name === entry.name)
      const byDefinition = actual.find((item) => definition(item) === definition(entry))
      return {
        name: entry.name,
        keys: entry.keys,
        unique: Boolean(entry.options.unique),
        status: byName ? (definition(byName) === definition(entry) ? 'PRESENT' : 'DIFFERENT') : byDefinition ? 'PRESENT_EQUIVALENT' : 'MISSING',
        actualName: byDefinition?.name,
      }
    })
    const plannedDefinitions = new Set(expected.map(definition))
    const extra = actual.filter((item) => item.name !== '_id_' && !plannedDefinitions.has(definition(item))).map((item) => ({ name: item.name, key: item.key }))
    collections.push({ collection, rows, extra })
  }
  return collections
}

export async function applyIndexPlan(db: Db) {
  const collisions = await auditUniqueCollisions(db)
  if (collisions.some((entry) => entry.conflictingGroups > 0 || entry.normalizedConflictingGroups > 0)) {
    throw new Error('Colisoes unique exatas ou normalizadas detectadas; apply abortado antes de createIndex.')
  }
  const before = await inspectIndexPlan(db)
  const different = before.flatMap((entry) => entry.rows.filter((row) => row.status === 'DIFFERENT').map((row) => `${entry.collection}.${row.name}`))
  if (different.length) throw new Error(`Indices com mesmo nome e definicao incompatível: ${different.join(', ')}`)
  const created = []
  for (const entry of MONGODB_INDEX_PLAN) {
    const row = before.find((item) => item.collection === entry.collection)?.rows.find((item) => item.name === entry.name)
    if (row?.status === 'PRESENT' || row?.status === 'PRESENT_EQUIVALENT') continue
    const name = await db.collection(entry.collection).createIndex(entry.keys, entry.options)
    created.push({ collection: entry.collection, name })
  }
  return { created, after: await inspectIndexPlan(db) }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const uri = process.env[args.uriEnv]
  if (!uri) throw new Error(`Variavel ${args.uriEnv} obrigatoria.`)
  const parsed = new URL(uri)
  const uriDatabase = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  if (!uriDatabase || uriDatabase !== args.database) throw new Error('Database da URI deve ser explicito e igual a --database.')
  const client = new MongoClient(uri, { appName: args.apply ? 'erp-souza-index-apply' : 'erp-souza-index-read-only-audit' })
  await client.connect()
  try {
    const db = client.db(args.database)
    const report = {
      mode: args.apply ? 'apply' : 'dry-run',
      target: args.target ?? 'read-only',
      database: args.database,
      plan: MONGODB_INDEX_PLAN,
      collisions: await auditUniqueCollisions(db),
      indexes: await inspectIndexPlan(db),
    }
    if (!args.apply) {
      console.log(JSON.stringify(report, null, 2))
      return
    }
    if (args.target === 'rehearsal') {
      const target = validateDestructiveMongoTestTarget(uri, process.env.ERP_INTEGRATION_RUN_ID, process.env.ATLAS_MONGODB_URI)
      await assertDisposableMongoMarker(db, target.runId)
      if (args.confirm !== 'APPLY_INDEX_PLAN_TO_DISPOSABLE_REHEARSAL') throw new Error('Confirmacao de rehearsal invalida.')
    } else {
      if (args.confirm !== 'APPLY_INDEX_PLAN_AFTER_RESTORABLE_SNAPSHOT') throw new Error('Confirmacao de producao invalida.')
      if (!args.snapshotEvidence?.trim()) throw new Error('--snapshot-evidence e obrigatorio para apply de producao.')
    }
    const result = await applyIndexPlan(db)
    console.log(JSON.stringify({ ...report, result }, null, 2))
  } finally {
    await client.close()
  }
}

if (process.argv[1]?.endsWith('manage-mongodb-indexes.ts')) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Falha no gerenciamento de indices.'
    console.error(message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, '<URI MongoDB redacted>'))
    process.exitCode = 1
  })
}
