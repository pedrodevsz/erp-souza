import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, before, test } from 'node:test'
import mongoose from 'mongoose'

import { CustomerModel } from '@/server/models/customers/customers.model'
import { InventoryModel } from '@/server/models/inventories/inventories.model'
import { ProductModel } from '@/server/models/products/products.model'
import { SaleModel } from '@/server/models/sales/sales.model'
import { validateMongoTestTarget } from './helpers/mongodb-test-target'

const runId = randomUUID()
const employeeOne = new mongoose.Types.ObjectId()
const employeeTwo = new mongoose.Types.ObjectId()
const insertedIds = new Map<string, mongoose.Types.ObjectId[]>()
const probeIds: mongoose.Types.ObjectId[] = []
let database: NonNullable<typeof mongoose.connection.db>

before(async () => {
  const uri = process.env.MONGODB_TEST_URI
  validateMongoTestTarget(uri, process.env.MONGODB_URI)
  await mongoose.connect(uri!, { bufferCommands: false, serverSelectionTimeoutMS: 5000 })
  database = mongoose.connection.db!

  const hello = await database.admin().command({ hello: 1 }) as { setName?: string; isWritablePrimary?: boolean }
  assert.equal(hello.setName, 'rs0', 'Mongo de integracao precisa ser replica set')
  assert.equal(hello.isWritablePrimary, true, 'Mongo de integracao precisa aceitar transacoes')
})

after(async () => {
  if (database) {
    for (const [collection, ids] of insertedIds) {
      await database.collection(collection).deleteMany({ _id: { $in: ids } })
    }
    if (probeIds.length) await database.collection('_audit_scope_transaction_probes').deleteMany({ _id: { $in: probeIds } })
  }
  await mongoose.disconnect()
})

test('replica set aceita transacao e a gravacao fica visivel fora da sessao', async () => {
  const probeId = new mongoose.Types.ObjectId()
  probeIds.push(probeId)
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await database.collection('_audit_scope_transaction_probes').insertOne({ _id: probeId, auditRunId: runId }, { session })
    })
  } finally {
    await session.endSession()
  }

  const persisted = await database.collection('_audit_scope_transaction_probes').findOne({ _id: probeId })
  assert.equal(persisted?.auditRunId, runId)
})

test('persistencia atual isola vendas, catalogo, clientes e estoque por userId', async () => {
  type ScopeRecord = { _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId }
  const datasets: Array<[string, mongoose.Model<ScopeRecord>]> = [
    [SaleModel.collection.name, SaleModel as unknown as mongoose.Model<ScopeRecord>],
    [ProductModel.collection.name, ProductModel as unknown as mongoose.Model<ScopeRecord>],
    [CustomerModel.collection.name, CustomerModel as unknown as mongoose.Model<ScopeRecord>],
    [InventoryModel.collection.name, InventoryModel as unknown as mongoose.Model<ScopeRecord>],
  ]

  for (const [collectionName] of datasets) {
    const ids = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
    insertedIds.set(collectionName, ids)
    await database.collection(collectionName).insertMany([
      { _id: ids[0], userId: employeeOne, auditRunId: runId, syntheticRecord: 'employee-one' },
      { _id: ids[1], userId: employeeTwo, auditRunId: runId, syntheticRecord: 'employee-two' },
    ])
  }

  for (const [collectionName, model] of datasets) {
    const oneSees = await model.find({ userId: employeeOne }).lean()
    const twoSees = await model.find({ userId: employeeTwo }).lean()
    assert.deepEqual(oneSees.map((row) => String(row._id)), [String(insertedIds.get(collectionName)![0])], `${collectionName}: funcionario 1`)
    assert.deepEqual(twoSees.map((row) => String(row._id)), [String(insertedIds.get(collectionName)![1])], `${collectionName}: funcionario 2`)

    const stored = await database.collection(collectionName).find({ auditRunId: runId }).toArray()
    assert.equal(stored.length, 2, `${collectionName}: estado final observado diretamente no Mongo`)
    assert.deepEqual(new Set(stored.map((row) => String(row.userId))), new Set([String(employeeOne), String(employeeTwo)]))
  }
})
