import assert from 'node:assert/strict'
import test from 'node:test'
import { MongoClient } from 'mongodb'

import { applyIndexPlan, inspectIndexPlan } from '../scripts/manage-mongodb-indexes'
import { INTEGRATION_MARKER_COLLECTION, assertDisposableMongoMarker, validateDestructiveMongoTestTarget } from './helpers/mongodb-test-target'

const uri = process.env.MONGODB_TEST_URI
const target = validateDestructiveMongoTestTarget(uri, process.env.ERP_INTEGRATION_RUN_ID, process.env.ATLAS_MONGODB_URI)

async function resetDisposableDatabase(client: MongoClient) {
  const db = client.db(target.database)
  await assertDisposableMongoMarker(db, target.runId)
  await db.dropDatabase()
  await db.collection<{ _id: string; runId: string }>(INTEGRATION_MARKER_COLLECTION).insertOne({ _id: 'container-runner', runId: target.runId })
  return db
}

async function expectDuplicate(operation: Promise<unknown>) {
  await assert.rejects(operation, (error: unknown) => Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000))
}

test('rehearsal cria plano idempotente, protege incompatibilidades e aplica constraints unique', async () => {
  const client = new MongoClient(uri!)
  await client.connect()
  try {
    let db = await resetDisposableDatabase(client)
    await db.collection('users').createIndex({ email: 1 }, { name: 'username_1' })
    await assert.rejects(applyIndexPlan(db), /mesmo nome e definicao incompatível/)

    db = await resetDisposableDatabase(client)
    await db.collection('users').insertOne({ username: 'ADMIN-A' })
    await db.collection('customers').insertMany([
      { storeId: 'store-a', document: '111' },
      { storeId: 'store-a', document: null },
      { storeId: 'store-a' },
    ])
    await db.collection('products').insertOne({ storeId: 'store-a', name: 'P1', unit: 'UN', brand: '' })
    await db.collection('inventories').insertOne({
      storeId: 'store-a', productName: 'P1', unit: 'UN', brand: '', sku: 'SKU-1', productId: 'product-1',
    })
    await db.collection('inventorycategories').insertOne({ storeId: 'store-a', name: 'GERAL' })
    await db.collection('suppliers').insertOne({ storeId: 'store-a', name: 'FORNECEDOR' })
    await db.collection('deliveries').insertOne({ storeId: 'store-a', saleId: 'sale-1' })
    await db.collection('users').createIndex({ storeId: 1 }, { name: 'storeId_1' })

    const first = await applyIndexPlan(db)
    assert.ok(first.created.length > 0)
    assert.equal(first.created.some((entry) => entry.collection === 'users' && entry.name === 'storeId_1'), false)
    const second = await applyIndexPlan(db)
    assert.equal(second.created.length, 0)
    const inspection = await inspectIndexPlan(db)
    assert.equal(inspection.flatMap((entry) => entry.rows).every((row) => row.status === 'PRESENT'), true)

    await expectDuplicate(db.collection('users').insertOne({ username: 'ADMIN-A' }))
    await expectDuplicate(db.collection('customers').insertOne({ storeId: 'store-a', document: '111' }))
    await db.collection('customers').insertMany([{ storeId: 'store-a', document: null }, { storeId: 'store-a' }])
    await expectDuplicate(db.collection('products').insertOne({ storeId: 'store-a', name: 'P1', unit: 'UN', brand: '' }))
    await expectDuplicate(db.collection('inventories').insertOne({
      storeId: 'store-a', productName: 'P1', unit: 'UN', brand: '', sku: 'SKU-2', productId: 'product-2',
    }))
    await expectDuplicate(db.collection('inventories').insertOne({
      storeId: 'store-a', productName: 'P2', unit: 'UN', brand: '', sku: 'SKU-1', productId: 'product-2',
    }))
    await expectDuplicate(db.collection('inventories').insertOne({
      storeId: 'store-a', productName: 'P2', unit: 'UN', brand: '', sku: 'SKU-2', productId: 'product-1',
    }))
    await expectDuplicate(db.collection('inventorycategories').insertOne({ storeId: 'store-a', name: 'GERAL' }))
    await expectDuplicate(db.collection('suppliers').insertOne({ storeId: 'store-a', name: 'FORNECEDOR' }))
    await expectDuplicate(db.collection('deliveries').insertOne({ storeId: 'store-a', saleId: 'sale-1' }))
  } finally {
    await client.close()
  }
})
