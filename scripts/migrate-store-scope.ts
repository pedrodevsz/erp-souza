import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { loadEnvConfig } from '@next/env'
import { MongoClient, ObjectId } from 'mongodb'

import { SINGLE_STORE_ID } from '@/server/store/constants'
import { assertAuthorizedUsers, assertMatchedCount, assertMigrationAuthorized, type MigrationAuthorization, type MigrationTarget } from './store-scope-migration-policy'

loadEnvConfig(process.cwd())

const operationalCollections = [
  'customers', 'products', 'inventories', 'inventorymovements', 'inventorycategories',
  'suppliers', 'purchases', 'sales', 'deliveries', 'productreservations', 'employees',
] as const

type Decisions = {
  storeId: string
  approvedOwnerIds: string[]
  authorizedUserIds: string[]
  expectedCounts: Record<string, number>
  authorization: MigrationAuthorization
}

function hash(value: unknown) {
  return createHash('sha256').update(String(value)).digest('hex').slice(0, 14)
}

function parseArgs(args: string[]) {
  const values = new Map<string, string>()
  let applyData = false
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--apply-data') {
      applyData = true
      continue
    }
    if (!['--database', '--uri-env', '--decisions', '--target', '--confirm'].includes(arg)) throw new Error(`Argumento nao suportado: ${arg}`)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Valor ausente para ${arg}.`)
    values.set(arg, value)
    index += 1
  }
  const database = values.get('--database')
  if (!database) throw new Error('--database e obrigatorio.')
  const target = values.get('--target') as MigrationTarget | undefined
  if (applyData && (!values.get('--decisions') || !target || !['rehearsal', 'production'].includes(target) || !values.get('--confirm'))) {
    throw new Error('--decisions, --target rehearsal|production e --confirm sao obrigatorios com --apply-data.')
  }
  return { database, uriEnv: values.get('--uri-env') ?? 'MONGODB_URI', decisionsPath: values.get('--decisions'), target, confirmation: values.get('--confirm'), applyData }
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR') : ''
}

async function inspect(client: MongoClient, database: string) {
  const db = client.db(database)
  const users = await db.collection('users').find({}, { projection: { _id: 1, storeId: 1 } }).toArray()
  const knownUsers = new Set(users.map((user) => String(user._id)))
  const collections: Record<string, unknown> = {}
  let total = 0

  for (const collection of operationalCollections) {
    const grouped = await db.collection(collection).aggregate([
      { $group: { _id: { userId: { $ifNull: ['$userId', null] }, storeId: { $ifNull: ['$storeId', null] } }, count: { $sum: 1 } } },
    ]).toArray()
    const count = grouped.reduce((sum, row) => sum + Number(row.count), 0)
    total += count
    collections[collection] = {
      count,
      owners: grouped.map((row) => ({
        userIdHash: row._id.userId == null ? '<missing>' : hash(row._id.userId),
        storeId: row._id.storeId ?? '<missing>',
        count: row.count,
        authorKnown: row._id.userId != null && knownUsers.has(String(row._id.userId)),
      })),
    }
  }

  const suppliers = await db.collection('suppliers').find({}, { projection: { _id: 1, userId: 1, name: 1 } }).toArray()
  const supplierGroups = new Map<string, typeof suppliers>()
  for (const supplier of suppliers) {
    const key = normalize(supplier.name)
    if (key) supplierGroups.set(key, [...(supplierGroups.get(key) ?? []), supplier])
  }
  const supplierConflicts = [...supplierGroups.entries()].filter(([, rows]) => rows.length > 1).map(([key, rows]) => ({
    keyHash: hash(key),
    documents: rows.map((row) => ({ idHash: hash(row._id), userIdHash: hash(row.userId) })),
  }))

  const saleProductReferences = await db.collection('sales').aggregate([
    { $unwind: '$items' },
    { $project: { saleId: '$_id', userId: 1, productId: '$items.productId' } },
  ]).toArray()
  const productIds = new Set((await db.collection('products').find({}, { projection: { _id: 1 } }).toArray()).map((row) => String(row._id)))
  const inventoryProductIds = new Set((await db.collection('inventories').find({}, { projection: { productId: 1 } }).toArray()).map((row) => String(row.productId)))
  const missingSaleProducts = saleProductReferences.filter((row) => !productIds.has(String(row.productId)) && !inventoryProductIds.has(String(row.productId)))

  return {
    database,
    storeId: SINGLE_STORE_ID,
    mode: 'dry-run',
    totalOperationalDocuments: total,
    collections,
    users: {
      total: users.length,
      associatedWithCanonicalStore: users.filter((user) => user.storeId === SINGLE_STORE_ID).length,
      withoutStore: users.filter((user) => user.storeId == null).length,
    },
    blockers: {
      supplierConflicts,
      missingSaleProductReferences: missingSaleProducts.map((row) => ({
        saleIdHash: hash(row.saleId), userIdHash: hash(row.userId), productIdHash: hash(row.productId),
      })),
      divergentStores: Object.entries(collections).flatMap(([collection, value]) =>
        (value as { owners: Array<{ storeId: string }> }).owners
          .filter((owner) => owner.storeId !== '<missing>' && owner.storeId !== SINGLE_STORE_ID)
          .map((owner) => ({ collection, storeId: owner.storeId }))
      ),
    },
  }
}

async function loadDecisions(path: string): Promise<Decisions> {
  const parsed = JSON.parse(await readFile(path, 'utf8')) as Decisions
  if (parsed.storeId !== SINGLE_STORE_ID) throw new Error('storeId das decisoes nao corresponde a loja canonica.')
  if (!parsed.approvedOwnerIds?.length || !parsed.authorizedUserIds?.length) throw new Error('Owners e usuarios autorizados precisam ser explicitos.')
  return parsed
}

async function applyData(client: MongoClient, database: string, decisions: Decisions, report: Awaited<ReturnType<typeof inspect>>) {
  const db = client.db(database)
  const ownerIds = decisions.approvedOwnerIds.map((id) => {
    if (!ObjectId.isValid(id)) throw new Error('Owner ID invalido nas decisoes.')
    return new ObjectId(id)
  })
  const authorizedUserIds = decisions.authorizedUserIds.map((id) => {
    if (!ObjectId.isValid(id)) throw new Error('User ID invalido nas decisoes.')
    return new ObjectId(id)
  })
  const authorizedUsers = await db.collection('users').find({ _id: { $in: authorizedUserIds } }, { projection: { _id: 1, isActive: 1, role: 1, storeId: 1 } }).toArray()
  assertAuthorizedUsers(authorizedUsers, decisions.authorizedUserIds, SINGLE_STORE_ID)
  for (const collection of operationalCollections) {
    const expected = decisions.expectedCounts[collection]
    const observed = (report.collections[collection] as { count: number }).count
    if (expected !== observed) throw new Error(`Contagem divergente em ${collection}: esperado ${expected}, observado ${observed}.`)
  }

  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      for (const collection of operationalCollections) {
        await db.collection(collection).updateMany(
          { storeId: { $exists: false }, userId: { $in: ownerIds } },
          { $set: { storeId: SINGLE_STORE_ID } },
          { session }
        )
      }
      const userUpdate = await db.collection('users').updateMany(
        { _id: { $in: authorizedUserIds } },
        { $set: { storeId: SINGLE_STORE_ID } },
        { session }
      )
      assertMatchedCount(userUpdate.matchedCount, authorizedUserIds.length)
      for (const collection of operationalCollections) {
        const missing = await db.collection(collection).countDocuments({ storeId: { $exists: false } }, { session })
        if (missing !== 0) throw new Error(`${collection} ainda teria ${missing} documentos sem storeId; transacao abortada.`)
      }
    })
  } finally {
    await session.endSession()
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const uri = process.env[args.uriEnv]
  if (!uri) throw new Error(`Variavel ${args.uriEnv} ausente.`)
  const parsedUri = new URL(uri)
  const uriDatabase = decodeURIComponent(parsedUri.pathname.replace(/^\//, ''))
  if (uriDatabase !== args.database) throw new Error('Database da URI precisa ser explicito e igual a --database.')

  const client = new MongoClient(uri, { appName: 'erp-souza-store-scope-migration' })
  await client.connect()
  try {
    const report = await inspect(client, args.database)
    console.log(JSON.stringify(report, null, 2))
    if (!args.applyData) return
    const decisions = await loadDecisions(args.decisionsPath!)
    assertMigrationAuthorized({
      target: args.target!,
      database: args.database,
      confirmation: args.confirmation!,
      authorization: decisions.authorization,
      blockers: report.blockers,
    })
    await applyData(client, args.database, decisions, report)
    console.log(JSON.stringify({ applied: true, storeId: SINGLE_STORE_ID, indexesChanged: false }))
  } finally {
    await client.close()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Falha na migracao de escopo.'
  console.error(message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, '<URI MongoDB redacted>'))
  process.exitCode = 1
})
