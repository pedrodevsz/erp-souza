import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import { MongoClient, ObjectId } from 'mongodb'
import { hash } from 'bcryptjs'

import { SINGLE_STORE_ID } from '@/server/auth/store-context'
import { applyIndexPlan } from '../scripts/manage-mongodb-indexes'
import { INTEGRATION_MARKER_COLLECTION, assertDisposableMongoMarker, validateDestructiveMongoTestTarget } from './helpers/mongodb-test-target'

type ApiResult<T> = { status: number; data?: T; message?: string }
type Inventory = { id: string; productId: string; productName: string; sku: string; unit: string; availableStock: number; salePrice: number }
type Sale = { id: string; revision: number; remainingAmount: number; paymentStatus: string; status: string; deliveryStatus: string; items: Array<{ productId: string; quantity: number }> }
type Purchase = { id: string; items: Array<{ productId: string; quantity: number }> }
type Reservation = { id: string; quantity: number }
type Delivery = { id: string; saleId: string; status: string; items: Array<{ id: string; quantity: number; delivered: boolean }> }
type Entity = { id: string; name?: string }

const uri = process.env.MONGODB_TEST_URI
const baseUrl = process.env.STORE_TEST_BASE_URL
const destructiveTarget = validateDestructiveMongoTestTarget(uri, process.env.ERP_INTEGRATION_RUN_ID, process.env.ATLAS_MONGODB_URI)
if (!baseUrl) throw new Error('STORE_TEST_BASE_URL obrigatoria para o teste HTTP.')

async function request<T>(path: string, cookie: string, method = 'GET', body?: unknown): Promise<ApiResult<T>> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json() as { success: boolean; data?: T; message?: string }
  return { status: response.status, data: payload.data, message: payload.message }
}

async function login(username: string, password: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  assert.equal(response.status, 200)
  const cookie = response.headers.get('set-cookie')?.split(';')[0]
  assert.ok(cookie)
  return cookie
}

function salePayload(inventory: Inventory, customerId: string, sellerId: string, marker: string, quantity = 1, paymentType: 'A_VISTA' | 'FIADO' = 'A_VISTA') {
  return {
    customerId,
    customerName: `CLIENTE ${marker}`,
    sellerId,
    sellerName: `VENDEDOR ${marker}`,
    saleDate: '2026-09-29',
    isDelivery: false,
    paymentMethod: paymentType === 'A_VISTA' ? 'PIX' : '',
    paymentCondition: { type: paymentType },
    payments: [],
    initialPayment: 0,
    notes: marker,
    discount: 0,
    shipping: 0,
    otherCosts: 0,
    items: [{
      productId: inventory.productId,
      productName: inventory.productName,
      brand: '',
      product: `${inventory.productName} ${inventory.unit}`,
      sku: inventory.sku,
      unit: inventory.unit,
      quantity,
      availableStock: inventory.availableStock,
      unitPrice: inventory.salePrice,
      discount: 0,
    }],
  }
}

test('escopo compartilhado, autoria, concorrencia e rollback via HTTP real', async () => {
  const client = new MongoClient(uri!)
    await client.connect()
    const db = client.db()
    await assertDisposableMongoMarker(db, destructiveTarget.runId)
  const run = randomUUID().slice(0, 8).toUpperCase()
  const password = `Senha-${run}-123`
  const passwordHash = await hash(password, 4)
  const actorA = new ObjectId()
    const actorB = new ObjectId()
    const actorC = new ObjectId()
  const unauthorized = new ObjectId()

  try {
    await db.dropDatabase()
    await db.collection<{ _id: string; runId: string }>(INTEGRATION_MARKER_COLLECTION).insertOne({ _id: 'container-runner', runId: destructiveTarget.runId })
    const indexResult = await applyIndexPlan(db)
    assert.ok(indexResult.created.length > 0)
    await db.collection('users').insertMany([
      { _id: actorA, username: `A-${run}`, passwordHash, role: 'ADMIN', isActive: true, storeId: SINGLE_STORE_ID, createdAt: new Date(), updatedAt: new Date() },
      { _id: actorB, username: `B-${run}`, passwordHash, role: 'USER', isActive: true, storeId: SINGLE_STORE_ID, createdAt: new Date(), updatedAt: new Date() },
      { _id: actorC, username: `C-${run}`, passwordHash, role: 'ADMIN', isActive: true, storeId: 'store-b-security-test', createdAt: new Date(), updatedAt: new Date() },
      { _id: unauthorized, username: `X-${run}`, passwordHash, role: 'USER', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ])

    const [cookieA, cookieB, cookieC, cookieX] = await Promise.all([
      login(`A-${run}`, password),
      login(`B-${run}`, password),
      login(`C-${run}`, password),
      login(`X-${run}`, password),
    ])

    const customerA = await request<Entity>('/api/customers', cookieA, 'POST', { name: `CLIENTE A ${run}`, addresses: [] })
    const sellerA = await request<Entity>('/api/employees', cookieA, 'POST', { name: `VENDEDOR A ${run}`, role: 'Vendedor', active: true })
    const customerB = await request<Entity>('/api/customers', cookieC, 'POST', { name: `CLIENTE B ${run}`, addresses: [] })
    const sellerB = await request<Entity>('/api/employees', cookieC, 'POST', { name: `VENDEDOR B ${run}`, role: 'Vendedor', active: true })
    assert.ok(customerA.data && sellerA.data && customerB.data && sellerB.data)
    assert.equal((await request(`/api/customers/${customerB.data!.id}`, cookieA)).status, 404)
    assert.equal((await request(`/api/customers/${customerB.data!.id}`, cookieA, 'PATCH', { name: `INVASAO ${run}` })).status, 404)
    assert.equal((await request(`/api/employees/${sellerB.data!.id}`, cookieA)).status, 404)

    const createdInventory = await request<Inventory>('/api/inventories', cookieA, 'POST', {
      productName: `PRODUTO COMPARTILHADO ${run}`, brand: '', category: 'GERAL', unit: 'UN', costPrice: 5,
      profitPercentage: 100, salePrice: 10, currentStock: 20, reservedStock: 0, location: 'LOJA', supplier: 'TESTE',
    })
    assert.equal(createdInventory.status, 201, createdInventory.message)
    assert.ok(createdInventory.data)
    const inventory = createdInventory.data
    const inventoryB = await request<Inventory>('/api/inventories', cookieC, 'POST', {
      productName: `PRODUTO STORE B ${run}`, brand: '', category: 'GERAL', unit: 'UN', costPrice: 5,
      profitPercentage: 100, salePrice: 10, currentStock: 20, reservedStock: 0, location: 'LOJA', supplier: 'TESTE',
    })
    assert.equal(inventoryB.status, 201, inventoryB.message)

    const sharedList = await request<Inventory[]>('/api/inventories', cookieB)
    assert.equal(sharedList.status, 200)
    assert.ok(sharedList.data?.some((item) => item.id === inventory.id))
    assert.equal((await request('/api/inventories', cookieX)).status, 403)
    assert.equal((await request<Inventory[]>('/api/inventories', cookieC)).data?.some((item) => item.id === inventory.id), false)
    assert.equal((await request(`/api/inventories/${inventory.id}`, cookieC)).status, 404)
    assert.equal((await request(`/api/inventories/${inventory.id}/minimum-stock`, cookieC, 'PATCH', { minimumStock: 1 })).status, 404)
    assert.equal((await request('/api/inventories', cookieA, 'POST', { storeId: 'store-b-security-test' })).status, 400)

    const usersVisibleToC = await request<Array<{ id: string }>>('/api/users', cookieC)
    assert.equal(usersVisibleToC.data?.some((user) => user.id === String(actorB)), false)
    assert.equal((await request(`/api/users/${actorB}`, cookieC, 'PATCH', { isActive: false })).status, 404)

    const crossCustomer = await request('/api/sales', cookieA, 'POST', salePayload(inventory, customerB.data!.id, sellerA.data!.id, `CROSS-CUSTOMER-${run}`))
    const crossSeller = await request('/api/sales', cookieA, 'POST', salePayload(inventory, customerA.data!.id, sellerB.data!.id, `CROSS-SELLER-${run}`))
    const crossProduct = await request('/api/sales', cookieA, 'POST', salePayload(inventoryB.data!, customerA.data!.id, sellerA.data!.id, `CROSS-PRODUCT-${run}`))
    assert.equal(crossCustomer.status, 404, crossCustomer.message)
    assert.equal(crossSeller.status, 404, crossSeller.message)
    assert.equal(crossProduct.status, 404, crossProduct.message)

    const reservation = await request<Reservation>('/api/product-reservations', cookieA, 'POST', {
      productId: inventory.productId,
      customerId: customerA.data!.id,
      quantity: 2,
    })
    assert.equal(reservation.status, 201, reservation.message)
    const sharedStoreSale = await request<Sale>('/api/sales', cookieB, 'POST', salePayload(
      inventory, customerA.data!.id, sellerA.data!.id, `SHARED-STORE-${run}`
    ))
    assert.equal(sharedStoreSale.status, 201, sharedStoreSale.message)
    assert.equal((await db.collection('productreservations').findOne({ _id: new ObjectId(reservation.data!.id) }))?.quantity, 1)
    assert.equal((await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.reservedStock, 1)
    assert.equal((await request(`/api/product-reservations/${reservation.data!.id}`, cookieC, 'DELETE')).status, 404)
    assert.equal((await request(`/api/product-reservations/${reservation.data!.id}`, cookieA, 'DELETE')).status, 200)
    assert.equal((await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.reservedStock, 0)

    const duplicatePayload = salePayload(inventory, customerA.data!.id, sellerA.data!.id, `DUPLICATE-${run}`)
    duplicatePayload.items = [
      { ...duplicatePayload.items[0], quantity: 2 },
      { ...duplicatePayload.items[0], quantity: 3 },
    ]
    const duplicateSale = await request<Sale>('/api/sales', cookieA, 'POST', duplicatePayload)
    assert.equal(duplicateSale.status, 201, duplicateSale.message)
    assert.equal(duplicateSale.data?.items.length, 1)
    assert.equal(duplicateSale.data?.items[0]?.quantity, 5)
    const stockAfterDuplicateCreate = (await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock
    const duplicateEdit = await request<Sale>(`/api/sales/${duplicateSale.data!.id}`, cookieA, 'PATCH', {
      items: [
        { ...duplicatePayload.items[0], quantity: 1 },
        { ...duplicatePayload.items[0], quantity: 1 },
      ],
      expectedRevision: duplicateSale.data!.revision,
    })
    assert.equal(duplicateEdit.status, 200, duplicateEdit.message)
    assert.equal(duplicateEdit.data?.items[0]?.quantity, 2)
    assert.equal((await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock, stockAfterDuplicateCreate + 3)

    const purchaseItem = {
      productId: inventory.productId, productName: inventory.productName, brand: '', product: inventory.productName,
      category: 'geral', quantity: 2, unit: inventory.unit, unitPrice: 5, profitPercentage: 100, salePrice: 10, discount: 0,
    }
    const stockBeforePurchase = (await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock
    const duplicatePurchase = await request<Purchase>('/api/purchases', cookieA, 'POST', {
      supplier: 'TESTE', paymentCondition: [], items: [purchaseItem, { ...purchaseItem, quantity: 3 }],
    })
    assert.equal(duplicatePurchase.status, 201, duplicatePurchase.message)
    assert.equal(duplicatePurchase.data?.items.length, 1)
    assert.equal(duplicatePurchase.data?.items[0]?.quantity, 5)
    assert.equal((await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock, stockBeforePurchase + 5)
    const purchaseEdit = await request<Purchase>(`/api/purchases/${duplicatePurchase.data!.id}`, cookieA, 'PATCH', {
      items: [{ ...purchaseItem, quantity: 1 }, { ...purchaseItem, quantity: 1 }],
    })
    assert.equal(purchaseEdit.status, 200, purchaseEdit.message)
    assert.equal(purchaseEdit.data?.items[0]?.quantity, 2)
    assert.equal((await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock, stockBeforePurchase + 2)
    const crossStorePurchase = await request('/api/purchases', cookieA, 'POST', {
      supplier: 'TESTE',
      paymentCondition: [],
      items: [{ ...purchaseItem, productId: inventoryB.data!.productId }],
    })
    assert.equal(crossStorePurchase.status, 404)

    const updatedByB = await request(`/api/inventories/${inventory.id}/minimum-stock`, cookieB, 'PATCH', { minimumStock: 2 })
    assert.equal(updatedByB.status, 200)
    const storedInventory = await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) })
    assert.equal(String(storedInventory?.createdBy), String(actorA))
    assert.equal(String(storedInventory?.updatedBy), String(actorB))
    const actors = new Set((await db.collection('inventorymovements').find({ itemId: inventory.id }).toArray()).map((row) => String(row.actorId)))
    assert.deepEqual(actors, new Set([String(actorA), String(actorB)]))

    const lastUnit = await request<Inventory>('/api/inventories', cookieA, 'POST', {
      productName: `ULTIMA UNIDADE ${run}`, brand: '', category: 'GERAL', unit: 'UN', costPrice: 5,
      profitPercentage: 100, salePrice: 10, currentStock: 1, reservedStock: 0, location: 'LOJA', supplier: 'TESTE',
    })
    assert.equal(lastUnit.status, 201)
    const simultaneousSales = await Promise.all([
      request<Sale>('/api/sales', cookieA, 'POST', salePayload(lastUnit.data!, customerA.data!.id, sellerA.data!.id, `LAST-A-${run}`)),
      request<Sale>('/api/sales', cookieB, 'POST', salePayload(lastUnit.data!, customerA.data!.id, sellerA.data!.id, `LAST-B-${run}`)),
    ])
    assert.deepEqual(simultaneousSales.map((result) => result.status).sort(), [201, 409])
    assert.equal((await db.collection('inventories').findOne({ _id: new ObjectId(lastUnit.data!.id) }))?.currentStock, 0)
    assert.equal(await db.collection('sales').countDocuments({ 'items.sku': lastUnit.data!.sku }), 1)

    const fiado = await request<Sale>('/api/sales', cookieA, 'POST', salePayload(inventory, customerA.data!.id, sellerA.data!.id, `FIADO-${run}`, 1, 'FIADO'))
    assert.equal(fiado.status, 201)
    assert.equal((await request(`/api/sales/${fiado.data!.id}/payments`, cookieA, 'POST', {
      amount: 1, date: '2026-02-30', paymentMethod: 'PIX',
    })).status, 400)
    const paymentBody = { amount: 10, date: '2026-09-29', paymentMethod: 'PIX' }
    const payments = await Promise.all([
      request<Sale>(`/api/sales/${fiado.data!.id}/payments`, cookieA, 'POST', paymentBody),
      request<Sale>(`/api/sales/${fiado.data!.id}/payments`, cookieB, 'POST', paymentBody),
    ])
    assert.equal(payments.filter((result) => result.status === 200).length, 1)
    assert.equal(payments.filter((result) => result.status === 409 || result.status === 400).length, 1)
    const storedFiado = await db.collection('sales').findOne({ _id: new ObjectId(fiado.data!.id) })
    assert.equal(storedFiado?.payments.length, 1)
    assert.equal(storedFiado?.paidAmount, 10)
    assert.equal(storedFiado?.remainingAmount, 0)

    const paidBeforeEdit = await request<Sale>('/api/sales', cookieA, 'POST', salePayload(inventory, customerA.data!.id, sellerA.data!.id, `PAID-EDIT-${run}`, 2, 'FIADO'))
    assert.equal(paidBeforeEdit.status, 201)
    const paidResult = await request<Sale>(`/api/sales/${paidBeforeEdit.data!.id}/payments`, cookieA, 'POST', {
      amount: 15, date: '2026-09-29', paymentMethod: 'PIX',
    })
    assert.equal(paidResult.status, 200)
    const invalidFinancialEdit = await request<Sale>(`/api/sales/${paidBeforeEdit.data!.id}`, cookieA, 'PATCH', {
      items: salePayload(inventory, customerA.data!.id, sellerA.data!.id, `PAID-EDIT-${run}`, 1, 'FIADO').items,
      expectedRevision: paidResult.data!.revision,
    })
    assert.equal(invalidFinancialEdit.status, 400)
    const preservedPaidSale = await db.collection('sales').findOne({ _id: new ObjectId(paidBeforeEdit.data!.id) })
    assert.equal(preservedPaidSale?.total, 20)
    assert.equal(preservedPaidSale?.paidAmount, 15)

    const cancellable = await request<Sale>('/api/sales', cookieA, 'POST', salePayload(inventory, customerA.data!.id, sellerA.data!.id, `CANCEL-${run}`))
    assert.equal(cancellable.status, 201)
    const stockAfterSale = (await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock
    const cancellations = await Promise.all([
      request<Sale>(`/api/sales/${cancellable.data!.id}/cancel`, cookieA, 'POST'),
      request<Sale>(`/api/sales/${cancellable.data!.id}/cancel`, cookieB, 'POST'),
    ])
    assert.ok(cancellations.every((result) => result.status === 200))
    const cancelled = await db.collection('sales').findOne({ _id: new ObjectId(cancellable.data!.id) })
    assert.equal(cancelled?.status, 'CANCELLED')
    assert.equal(cancelled?.history.filter((entry: { action: string }) => entry.action === 'CANCELLED').length, 1)
    assert.equal((await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock, stockAfterSale + 1)
    assert.equal((await request(`/api/sales/${cancellable.data!.id}/cancel`, cookieA, 'POST')).status, 200)
    assert.equal((await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock, stockAfterSale + 1)

    const editable = await request<Sale>('/api/sales', cookieA, 'POST', salePayload(inventory, customerA.data!.id, sellerA.data!.id, `EDIT-${run}`))
    assert.equal(editable.status, 201)
    const edits = await Promise.all([
      request<Sale>(`/api/sales/${editable.data!.id}`, cookieA, 'PATCH', { notes: `EDICAO A ${run}`, expectedRevision: editable.data!.revision }),
      request<Sale>(`/api/sales/${editable.data!.id}`, cookieB, 'PATCH', { notes: `EDICAO B ${run}`, expectedRevision: editable.data!.revision }),
    ])
    assert.equal(edits.filter((result) => result.status === 200).length, 1, JSON.stringify(edits))
    assert.equal(edits.filter((result) => result.status === 409).length, 1)
    const storedEditable = await db.collection('sales').findOne({ _id: new ObjectId(editable.data!.id) })
    assert.equal(storedEditable?.history.filter((entry: { action: string }) => entry.action === 'UPDATED').length, 1)

    const deliveryPayload = { ...salePayload(inventory, customerA.data!.id, sellerA.data!.id, `DELIVERY-${run}`), isDelivery: true, deliveryDate: '2026-09-30' }
    const deliverySale = await request<Sale>('/api/sales', cookieA, 'POST', deliveryPayload)
    assert.equal(deliverySale.status, 201)
    const seededDeliveries = await request<Delivery[]>('/api/deliveries', cookieB)
    assert.equal(seededDeliveries.status, 200)
    let delivery = seededDeliveries.data?.find((entry) => entry.saleId === deliverySale.data!.id)
    assert.ok(delivery)

    const twoItems = deliveryPayload.items.map((item) => ({ ...item, quantity: 2 }))
    const synchronizedEdit = await request<Sale>(`/api/sales/${deliverySale.data!.id}`, cookieB, 'PATCH', {
      items: twoItems,
      expectedRevision: deliverySale.data!.revision,
    })
    assert.equal(synchronizedEdit.status, 200, synchronizedEdit.message)
    delivery = (await request<Delivery[]>(`/api/deliveries`, cookieA)).data?.find((entry) => entry.saleId === deliverySale.data!.id)
    assert.equal(delivery?.items[0]?.quantity, 2)

    const deliveredItem = await request<Delivery>(
      `/api/deliveries/${delivery!.id}/items/${encodeURIComponent(delivery!.items[0]!.id)}/delivered`,
      cookieA,
      'PATCH'
    )
    assert.equal(deliveredItem.status, 200)
    const stockBeforeBlockedEdit = (await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock
    const blockedDeliveryEdit = await request<Sale>(`/api/sales/${deliverySale.data!.id}`, cookieB, 'PATCH', {
      items: deliveryPayload.items.map((item) => ({ ...item, quantity: 3 })),
      expectedRevision: synchronizedEdit.data!.revision,
    })
    assert.equal(blockedDeliveryEdit.status, 409)
    const preservedDelivery = await db.collection('deliveries').findOne({ _id: new ObjectId(delivery!.id) })
    assert.equal(preservedDelivery?.items[0]?.quantity, 2)
    assert.equal(preservedDelivery?.items[0]?.delivered, true)
    assert.equal((await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock, stockBeforeBlockedEdit)

    const deleteWithDelivery = await request(`/api/sales/${deliverySale.data!.id}`, cookieA, 'DELETE')
    assert.equal(deleteWithDelivery.status, 409)
    const stockBeforeDeliveryCancel = (await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock
    const cancelDeliverySale = await request<Sale>(`/api/sales/${deliverySale.data!.id}/cancel`, cookieA, 'POST')
    assert.equal(cancelDeliverySale.status, 200)
    assert.equal(cancelDeliverySale.data?.deliveryStatus, 'CANCELLED')
    assert.equal((await db.collection('deliveries').findOne({ _id: new ObjectId(delivery!.id) }))?.status, 'CANCELLED')
    const stockAfterDeliveryCancel = (await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock
    assert.equal(stockAfterDeliveryCancel, stockBeforeDeliveryCancel + 2)
    assert.equal((await request(`/api/sales/${deliverySale.data!.id}/cancel`, cookieB, 'POST')).status, 200)
    assert.equal((await db.collection('inventories').findOne({ _id: new ObjectId(inventory.id) }))?.currentStock, stockAfterDeliveryCancel)

    const directlyCancelledSale = await request<Sale>('/api/sales', cookieA, 'POST', {
      ...deliveryPayload,
      notes: `DIRECT-DELIVERY-CANCEL-${run}`,
    })
    assert.equal(directlyCancelledSale.status, 201)
    const directlyCancelledDelivery = (await request<Delivery[]>('/api/deliveries', cookieA)).data
      ?.find((entry) => entry.saleId === directlyCancelledSale.data!.id)
    assert.ok(directlyCancelledDelivery)
    assert.equal((await request(`/api/deliveries/${directlyCancelledDelivery.id}/cancel`, cookieA, 'PATCH')).status, 200)
    assert.equal((await request<Sale>(`/api/sales/${directlyCancelledSale.data!.id}`, cookieA)).data?.deliveryStatus, 'CANCELLED')

    const salesBeforeRollback = await db.collection('sales').countDocuments({ notes: `ROLLBACK-${run}` })
    const missingInventory = { ...inventory, productId: new ObjectId().toString(), productName: `INEXISTENTE ${run}`, sku: `MISS-${run}` }
    const rollback = await request<Sale>('/api/sales', cookieA, 'POST', salePayload(missingInventory, customerA.data!.id, sellerA.data!.id, `ROLLBACK-${run}`))
    assert.equal(rollback.status, 404)
    assert.equal(await db.collection('sales').countDocuments({ notes: `ROLLBACK-${run}` }), salesBeforeRollback)

    const createdBy = new Set((await db.collection('sales').find({ storeId: SINGLE_STORE_ID }).toArray()).map((row) => String(row.createdBy)))
    assert.ok(createdBy.has(String(actorA)))
    assert.ok(createdBy.has(String(actorB)))
  } finally {
    await client.close()
  }
})
