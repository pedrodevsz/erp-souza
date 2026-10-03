import { createHash } from 'node:crypto'
import { loadEnvConfig } from '@next/env'
import { MongoClient, type Db } from 'mongodb'

type Row = Record<string, unknown> & { _id: unknown; userId?: unknown }
type ReferenceIssue = { sourceId: string; targetId: string; sourceUserId: string; targetUserId?: string }

loadEnvConfig(process.cwd())

let databaseConnection: Db | undefined

const collectionNames = [
  'users', 'customers', 'products', 'inventories', 'inventorymovements',
  'inventorycategories', 'suppliers', 'purchases', 'sales', 'deliveries',
  'productreservations', 'employees',
] as const

function parseArgs(args: string[]) {
  const options = new Map<string, string>()
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== '--uri-env' && args[i] !== '--database') throw new Error(`Argumento nao suportado: ${args[i]}`)
    const value = args[i + 1]
    if (!value || value.startsWith('--')) throw new Error(`Valor obrigatorio ausente para ${args[i]}.`)
    options.set(args[i], value)
    i += 1
  }
  const uriEnv = options.get('--uri-env') ?? 'MONGODB_URI'
  const database = options.get('--database')
  if (!database) throw new Error('Uso: pnpm exec tsx scripts/audit-store-scope.ts --database <database> [--uri-env MONGODB_URI]')
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(uriEnv)) throw new Error('--uri-env deve ser apenas o nome de uma variavel de ambiente.')
  return { uriEnv, database }
}

function safeId(value: unknown) {
  return value == null ? '<missing>' : `id:${keyHash(String(value))}`
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR') : ''
}

function maskedText(value: unknown) {
  const normalized = normalizeText(value)
  if (!normalized) return '<missing>'
  if (normalized.length <= 2) return `${normalized[0]}*`
  return `${normalized[0]}${'*'.repeat(Math.min(normalized.length - 2, 8))}${normalized.at(-1)}`
}

function safeDate(value: unknown) {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : '<missing>'
}

function keyHash(key: string) {
  return createHash('sha256').update(key).digest('hex').slice(0, 14)
}

function idKey(value: unknown) {
  return value == null ? '' : String(value)
}

function indexRows(rows: Row[], keyOf: (row: Row) => string) {
  const index = new Map<string, Row[]>()
  for (const row of rows) {
    const key = keyOf(row)
    if (key) index.set(key, [...(index.get(key) ?? []), row])
  }
  return index
}

function matchingOwner(candidates: Row[] | undefined, source: Row) {
  return candidates?.find((candidate) => idKey(candidate.userId) === idKey(source.userId)) ?? candidates?.[0]
}

async function readRows(collection: string, projection: Record<string, 1>) {
  const db = databaseConnection
  if (!db || !(collectionNames as readonly string[]).includes(collection)) throw new Error('Acesso a collection nao aprovada para auditoria.')
  return (await db.collection(collection).find({}, { projection }).toArray()) as unknown as Row[]
}

async function countsByOwner() {
  const db = databaseConnection!
  const report: Record<string, Array<{ userId: string; storeId: string; count: number }>> = {}
  for (const name of collectionNames) {
    const rows = await db.collection(name).aggregate([
      { $group: { _id: { userId: { $ifNull: ['$userId', null] }, storeId: { $ifNull: ['$storeId', null] } }, count: { $sum: 1 } } },
      { $sort: { '_id.userId': 1, '_id.storeId': 1 } },
    ]).toArray() as unknown as Array<{ _id: { userId: unknown; storeId: unknown }; count: number }>
    report[name] = rows.map((row) => ({ userId: safeId(row._id.userId), storeId: safeId(row._id.storeId), count: row.count }))
  }
  return report
}

function collisionGroups(rows: Row[], keyOf: (row: Row) => string) {
  const groups = new Map<string, Row[]>()
  for (const row of rows) {
    const key = keyOf(row)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  return [...groups.entries()]
    .filter(([, docs]) => docs.length > 1)
    .map(([key, docs]) => ({ keyHash: keyHash(key), documents: docs.map((doc) => ({ id: safeId(doc._id), userId: safeId(doc.userId) })) }))
}

function refIssue(source: Row, targetId: unknown, target: Row | undefined): ReferenceIssue {
  return {
    sourceId: safeId(source._id),
    targetId: safeId(targetId),
    sourceUserId: safeId(source.userId),
    ...(target ? { targetUserId: safeId(target.userId) } : {}),
  }
}

function auditReferences(rows: {
  sales: Row[]; customers: Row[]; products: Row[]; inventories: Row[]; purchases: Row[];
  deliveries: Row[]; reservations: Row[]; movements: Row[]; employees: Row[]; suppliers: Row[];
}) {
  const maps = {
    customers: indexRows(rows.customers, (row) => idKey(row._id)),
    products: indexRows(rows.products, (row) => idKey(row._id)),
    inventoriesById: indexRows(rows.inventories, (row) => idKey(row._id)),
    inventoriesByProduct: indexRows(rows.inventories, (row) => idKey(row.productId)),
    sales: indexRows(rows.sales, (row) => idKey(row._id)),
    employees: indexRows(rows.employees, (row) => idKey(row._id)),
    suppliers: indexRows(rows.suppliers, (row) => normalizeText(row.name)),
  }
  const output: Record<string, { missing: ReferenceIssue[]; crossUser: ReferenceIssue[] }> = {}
  const record = (label: string, source: Row, targetId: unknown, target?: Row) => {
    if (targetId == null || targetId === '') return
    const bucket = output[label] ??= { missing: [], crossUser: [] }
    if (!target) bucket.missing.push(refIssue(source, targetId, undefined))
    else if (idKey(source.userId) !== idKey(target.userId)) bucket.crossUser.push(refIssue(source, targetId, target))
  }

  for (const sale of rows.sales) {
    record('Sale.customerId -> Customer._id', sale, sale.customerId, matchingOwner(maps.customers.get(idKey(sale.customerId)), sale))
    record('Sale.sellerId -> Employee._id', sale, sale.sellerId, matchingOwner(maps.employees.get(idKey(sale.sellerId)), sale))
    for (const item of Array.isArray(sale.items) ? sale.items as Row[] : []) {
      const candidates = [...(maps.products.get(idKey(item.productId)) ?? []), ...(maps.inventoriesByProduct.get(idKey(item.productId)) ?? [])]
      const target = matchingOwner(candidates, sale)
      record('Sale.items[].productId -> Product/Inventory', sale, item.productId, target)
    }
  }
  for (const purchase of rows.purchases) {
    const supplierKey = normalizeText(purchase.supplier)
    record('Purchase.supplier -> Supplier.name (text match)', purchase, keyHash(supplierKey), matchingOwner(maps.suppliers.get(supplierKey), purchase))
    for (const item of Array.isArray(purchase.items) ? purchase.items as Row[] : []) {
      const candidates = [...(maps.products.get(idKey(item.productId)) ?? []), ...(maps.inventoriesByProduct.get(idKey(item.productId)) ?? [])]
      const target = matchingOwner(candidates, purchase)
      record('Purchase.items[].productId -> Product/Inventory', purchase, item.productId, target)
    }
  }
  for (const delivery of rows.deliveries) {
    record('Delivery.saleId -> Sale._id', delivery, delivery.saleId, matchingOwner(maps.sales.get(idKey(delivery.saleId)), delivery))
    record('Delivery.customerId -> Customer._id', delivery, delivery.customerId, matchingOwner(maps.customers.get(idKey(delivery.customerId)), delivery))
  }
  for (const reservation of rows.reservations) {
    record('ProductReservation.inventoryId -> Inventory._id', reservation, reservation.inventoryId, matchingOwner(maps.inventoriesById.get(idKey(reservation.inventoryId)), reservation))
    record('ProductReservation.customerId -> Customer._id', reservation, reservation.customerId, matchingOwner(maps.customers.get(idKey(reservation.customerId)), reservation))
    const candidates = [...(maps.products.get(idKey(reservation.productId)) ?? []), ...(maps.inventoriesByProduct.get(idKey(reservation.productId)) ?? [])]
    const target = matchingOwner(candidates, reservation)
    record('ProductReservation.productId -> Product/Inventory', reservation, reservation.productId, target)
  }
  for (const movement of rows.movements) {
    record('InventoryMovement.itemId -> Inventory._id', movement, movement.itemId, matchingOwner(maps.inventoriesById.get(idKey(movement.itemId)), movement))
  }
  return output
}

function auditConflictDetails(rows: { suppliers: Row[]; purchases: Row[]; inventories: Row[]; sales: Row[]; products: Row[]; deliveries: Row[] }) {
  const supplierGroups = indexRows(rows.suppliers, (row) => normalizeText(row.name))
  const conflictingSuppliers = [...supplierGroups.entries()]
    .filter(([, suppliers]) => suppliers.length > 1)
    .map(([name, suppliers]) => ({
      normalizedNameHash: keyHash(name),
      maskedName: maskedText(name),
      documents: suppliers.map((supplier) => ({
        id: safeId(supplier._id),
        userId: safeId(supplier.userId),
        createdAt: safeDate(supplier.createdAt),
        updatedAt: safeDate(supplier.updatedAt),
        purchaseReferences: rows.purchases.filter((purchase) => idKey(purchase.userId) === idKey(supplier.userId) && normalizeText(purchase.supplier) === name).length,
        inventoryReferences: rows.inventories.filter((inventory) => idKey(inventory.userId) === idKey(supplier.userId) && normalizeText(inventory.supplier) === name).length,
      })),
    }))

  const products = indexRows(rows.products, (row) => idKey(row._id))
  const inventoriesByProduct = indexRows(rows.inventories, (row) => idKey(row.productId))
  const deliveriesBySale = indexRows(rows.deliveries, (row) => idKey(row.saleId))
  const missingSaleItemSnapshots = rows.sales.flatMap((sale) =>
    (Array.isArray(sale.items) ? sale.items as Row[] : []).flatMap((item) => {
      const candidates = [...(products.get(idKey(item.productId)) ?? []), ...(inventoriesByProduct.get(idKey(item.productId)) ?? [])]
      if (candidates.length > 0) return []
      const fallbackInventoryMatches = rows.inventories.filter((inventory) =>
        idKey(inventory.userId) === idKey(sale.userId) &&
        normalizeText(inventory.productName) === normalizeText(item.productName) &&
        normalizeText(inventory.unit) === normalizeText(item.unit) &&
        normalizeText(inventory.brand) === normalizeText(item.brand)
      )
      const delivery = matchingOwner(deliveriesBySale.get(idKey(sale._id)), sale)
      const deliveryItem = Array.isArray(delivery?.items)
        ? (delivery.items as Row[]).find((candidate) => idKey(candidate.productId) === idKey(item.productId))
        : undefined
      return [{
        saleId: safeId(sale._id),
        userId: safeId(sale.userId),
        productId: safeId(item.productId),
        productNameHash: normalizeText(item.productName) ? keyHash(normalizeText(item.productName)) : '<missing>',
        productNamePresent: Boolean(normalizeText(item.productName)),
        unit: normalizeText(item.unit) || '<missing>',
        quantity: typeof item.quantity === 'number' ? item.quantity : '<missing>',
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : '<missing>',
        inventoryFallbackMatchCount: fallbackInventoryMatches.length,
        deliverySnapshot: deliveryItem ? {
          deliveryId: safeId(delivery?._id),
          productNamePresent: Boolean(normalizeText(deliveryItem.productName)),
          unit: normalizeText(deliveryItem.unit) || '<missing>',
          quantity: typeof deliveryItem.quantity === 'number' ? deliveryItem.quantity : '<missing>',
          delivered: typeof deliveryItem.delivered === 'boolean' ? deliveryItem.delivered : '<missing>',
        } : null,
      }]
    })
  )

  return { conflictingSuppliers, missingSaleItemSnapshots }
}

async function main() {
  const { uriEnv, database } = parseArgs(process.argv.slice(2))
  const uri = process.env[uriEnv]
  if (!uri) throw new Error(`A variavel ${uriEnv} e obrigatoria; nenhuma URI alternativa sera usada.`)
  const parsed = new URL(uri)
  const uriDatabase = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  if (!uriDatabase || uriDatabase !== database) throw new Error('O database da URI deve ser explicito e igual a --database.')

  const client = new MongoClient(uri, {
    appName: 'erp-souza-read-only-store-scope-audit',
    serverSelectionTimeoutMS: 10_000,
  })
  await client.connect()
  databaseConnection = client.db(database)
  try {
    const hello = await databaseConnection.admin().command({ hello: 1 }) as { setName?: string; msg?: string }
    console.log(JSON.stringify({
      destination: {
        scheme: parsed.protocol,
        clusterHost: parsed.hostname,
        database,
        topology: hello.msg === 'isdbgrid' ? 'sharded' : hello.setName ? 'replica-set' : 'standalone',
        ...(hello.setName ? { replicaSetHash: keyHash(hello.setName) } : {}),
      },
    }))

    const [counts, users, customers, products, inventories, movements, purchases, sales, deliveries, reservations, employees, suppliers, categories] = await Promise.all([
      countsByOwner(),
      readRows('users', { _id: 1, role: 1, isActive: 1 }),
      readRows('customers', { _id: 1, userId: 1, document: 1 }),
      readRows('products', { _id: 1, userId: 1, name: 1, unit: 1, brand: 1 }),
      readRows('inventories', { _id: 1, userId: 1, productId: 1, sku: 1, productName: 1, unit: 1, brand: 1, supplier: 1 }),
      readRows('inventorymovements', { _id: 1, userId: 1, itemId: 1 }),
      readRows('purchases', { _id: 1, userId: 1, supplier: 1, items: 1 }),
      readRows('sales', { _id: 1, userId: 1, customerId: 1, sellerId: 1, items: 1 }),
      readRows('deliveries', { _id: 1, userId: 1, saleId: 1, customerId: 1, items: 1 }),
      readRows('productreservations', { _id: 1, userId: 1, inventoryId: 1, productId: 1, customerId: 1 }),
      readRows('employees', { _id: 1, userId: 1 }),
      readRows('suppliers', { _id: 1, userId: 1, name: 1, createdAt: 1, updatedAt: 1 }),
      readRows('inventorycategories', { _id: 1, userId: 1, name: 1 }),
    ])

    const conflicts = {
      Customer_document: collisionGroups(customers, (row) => typeof row.document === 'string' ? row.document.replace(/\D/g, '') : ''),
      Product_name_unit_brand: collisionGroups(products, (row) => [normalizeText(row.name), normalizeText(row.unit), normalizeText(row.brand)].join('|')),
      Inventory_name_unit_brand: collisionGroups(inventories, (row) => [normalizeText(row.productName), normalizeText(row.unit), normalizeText(row.brand)].join('|')),
      Inventory_sku: collisionGroups(inventories, (row) => normalizeText(row.sku)),
      Inventory_productId: collisionGroups(inventories, (row) => idKey(row.productId)),
      InventoryCategory_name: collisionGroups(categories, (row) => normalizeText(row.name)),
      Supplier_name: collisionGroups(suppliers, (row) => normalizeText(row.name)),
      Delivery_saleId: collisionGroups(deliveries, (row) => idKey(row.saleId)),
    }
    const userIds = new Set(users.map((user) => idKey(user._id)))
    const authorCollections: Record<string, Row[]> = { customers, products, inventories, movements, purchases, sales, deliveries, reservations, employees, suppliers, categories }
    const unknownAuthors = Object.fromEntries(Object.entries(authorCollections).map(([name, rows]) => [name, {
      recordsWithoutUserId: rows.filter((row) => row.userId == null).length,
      recordsWithUnknownUserId: rows.filter((row) => row.userId != null && !userIds.has(idKey(row.userId))).length,
    }]))
    const references = auditReferences({ sales, customers, products, inventories, purchases, deliveries, reservations, movements, employees, suppliers })
    const conflictDetails = auditConflictDetails({ suppliers, purchases, inventories, sales, products, deliveries })

    console.log(JSON.stringify({
      countsByCollectionAndUserId: counts,
      usersByRoleAndStatus: users.reduce((acc, user) => {
        const key = `${String(user.role ?? 'missing')}:${String(user.isActive ?? 'missing')}`
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {} as Record<string, number>),
      unknownAuthors,
      potentialUniqueKeyCollisions: conflicts,
      references,
      conflictDetails,
    }, null, 2))
  } finally {
    databaseConnection = undefined
    await client.close()
  }
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Falha na auditoria read-only.'
  console.error(message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, '<URI MongoDB redacted>'))
  process.exitCode = 1
})
