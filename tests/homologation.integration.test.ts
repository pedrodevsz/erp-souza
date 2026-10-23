import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { request as httpsRequest } from 'node:https'
import { after, before, test } from 'node:test'
import { MongoClient, ObjectId, type Db } from 'mongodb'

import { HOMOLOGATION_DATABASE, requireHomologationWriteConfirmation, validateHomologationUri } from '../scripts/homologation-target'
import { SINGLE_STORE_ID } from '../src/server/store/constants'

type ApiResult<T> = { status: number; data?: T; message?: string; setCookie?: string }
type Entity = { id: string; name?: string }
type User = Entity & { username: string; role: 'ADMIN' | 'USER'; isActive: boolean }
type Inventory = Entity & {
  productId: string
  productName: string
  sku: string
  unit: string
  currentStock: number
  availableStock: number
  salePrice: number
}
type Sale = Entity & { status: 'ACTIVE' | 'CANCELLED'; revision: number }

const uri = process.env.MONGODB_URI
const baseUrl = process.env.HOMOLOGATION_BASE_URL
const connectAddress = process.env.HOMOLOGATION_CONNECT_ADDRESS
const adminUsername = process.env.HOMOLOG_ADMIN_USERNAME
const adminPassword = process.env.HOMOLOG_ADMIN_PASSWORD
const runId = randomUUID()
const marker = `HOMOLOG-${runId}`.toUpperCase()
const userUsername = `USER-${runId}`.toUpperCase()
const userPassword = `Senha-${runId}-Aa1!`
const customerName = `CLIENTE ${marker}`
const employeeName = `VENDEDOR ${marker}`
const productName = `PRODUTO ${marker}`

let client: MongoClient
let db: Db
let adminCookie = ''
let userCookie = ''
const ids = {
  users: [] as ObjectId[],
  customers: [] as ObjectId[],
  employees: [] as ObjectId[],
  inventories: [] as ObjectId[],
  products: [] as ObjectId[],
  sales: [] as ObjectId[],
  probes: [] as ObjectId[],
}

function objectId(value: string) {
  assert.ok(ObjectId.isValid(value), `ID MongoDB invalido: ${value}`)
  return new ObjectId(value)
}

async function api<T>(path: string, options: { method?: string; cookie?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  const target = new URL(`${baseUrl}${path}`)
  const body = options.body === undefined ? undefined : JSON.stringify(options.body)
  return new Promise((resolve, reject) => {
    const request = httpsRequest({
      protocol: target.protocol,
      hostname: connectAddress || target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method: options.method ?? 'GET',
      servername: target.hostname,
      headers: {
        host: target.host,
        ...(body === undefined ? {} : { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) }),
        ...(options.cookie ? { cookie: options.cookie } : {}),
      },
    }, (response) => {
      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => chunks.push(chunk))
      response.on('end', () => {
        try {
          const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { data?: T; message?: string }
          resolve({
            status: response.statusCode ?? 0,
            data: payload.data,
            message: payload.message,
            setCookie: response.headers['set-cookie']?.[0],
          })
        } catch (error) {
          reject(error)
        }
      })
    })
    request.on('error', reject)
    if (body !== undefined) request.write(body)
    request.end()
  })
}

async function login(username: string, password: string) {
  const result = await api<{ user: User }>('/api/auth/login', { method: 'POST', body: { username, password } })
  assert.equal(result.status, 200, result.message)
  assert.match(result.setCookie ?? '', /sis_sz_session=/)
  assert.match(result.setCookie ?? '', /HttpOnly/i)
  assert.match(result.setCookie ?? '', /Secure/i)
  assert.match(result.setCookie ?? '', /SameSite=Lax/i)
  return result.setCookie!.split(';')[0]!
}

function salePayload(inventory: Inventory, customerId: string, employeeId: string, suffix: string, quantity: number) {
  return {
    customerId,
    customerName,
    sellerId: employeeId,
    sellerName: employeeName,
    saleDate: '2026-10-22',
    isDelivery: false,
    paymentMethod: 'PIX',
    paymentCondition: { type: 'A_VISTA' },
    payments: [],
    initialPayment: 0,
    notes: `${marker}-${suffix}`,
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

before(async () => {
  if (process.env.APP_ENV !== 'homologation') throw new Error('APP_ENV=homologation obrigatorio.')
  requireHomologationWriteConfirmation()
  validateHomologationUri(uri)
  if (!baseUrl?.startsWith('https://')) throw new Error('HOMOLOGATION_BASE_URL deve usar HTTPS.')
  if (!adminUsername || !adminPassword) throw new Error('Credenciais do administrador de homologacao sao obrigatorias no ambiente.')

  client = new MongoClient(uri!, { appName: 'erp-souza-homolog-integration' })
  await client.connect()
  db = client.db(HOMOLOGATION_DATABASE)
})

after(async () => {
  if (!db) return
  await db.collection('deliveries').deleteMany({ saleId: { $in: ids.sales.map(String) } })
  await db.collection('sales').deleteMany({ _id: { $in: ids.sales } })
  await db.collection('inventorymovements').deleteMany({ itemId: { $in: ids.inventories.map(String) } })
  await db.collection('productreservations').deleteMany({ inventoryId: { $in: ids.inventories.map(String) } })
  await db.collection('purchases').deleteMany({ [`items.productId`]: { $in: ids.products.map(String) } })
  await db.collection('inventories').deleteMany({ _id: { $in: ids.inventories } })
  await db.collection('products').deleteMany({ _id: { $in: ids.products } })
  await db.collection('employees').deleteMany({ _id: { $in: ids.employees } })
  await db.collection('customers').deleteMany({ _id: { $in: ids.customers } })
  await db.collection('users').deleteMany({ _id: { $in: ids.users } })
  await db.collection('_homologation_transaction_probes').deleteMany({ _id: { $in: ids.probes } })
  await client.close()
})

test('Atlas aceita commit e rollback de transacao no database de homologacao', async () => {
  const committed = new ObjectId()
  const rolledBack = new ObjectId()
  ids.probes.push(committed, rolledBack)

  const commitSession = client.startSession()
  try {
    await commitSession.withTransaction(async () => {
      await db.collection('_homologation_transaction_probes').insertOne({ _id: committed, runId }, { session: commitSession })
    })
  } finally {
    await commitSession.endSession()
  }
  assert.ok(await db.collection('_homologation_transaction_probes').findOne({ _id: committed, runId }))

  const rollbackSession = client.startSession()
  await assert.rejects(async () => {
    try {
      await rollbackSession.withTransaction(async () => {
        await db.collection('_homologation_transaction_probes').insertOne({ _id: rolledBack, runId }, { session: rollbackSession })
        throw new Error('falha-controlada-homologacao')
      })
    } finally {
      await rollbackSession.endSession()
    }
  }, /falha-controlada-homologacao/)
  assert.equal(await db.collection('_homologation_transaction_probes').findOne({ _id: rolledBack }), null)
})

test('login, cookie seguro, sessao, bloqueio anonimo, roles e logout', async () => {
  assert.equal((await api('/api/auth/login', { method: 'POST', body: { username: adminUsername, password: `${adminPassword}-INVALIDA` } })).status, 401)
  assert.equal((await api('/api/auth/me')).status, 401)
  assert.equal((await api('/api/customers')).status, 401)

  adminCookie = await login(adminUsername!, adminPassword!)
  const me = await api<{ user: User }>('/api/auth/me', { cookie: adminCookie })
  assert.equal(me.status, 200)
  assert.equal(me.data?.user.role, 'ADMIN')

  const createdUser = await api<User>('/api/users', { method: 'POST', cookie: adminCookie, body: { username: userUsername, password: userPassword } })
  assert.equal(createdUser.status, 201, createdUser.message)
  assert.equal(createdUser.data?.role, 'USER')
  ids.users.push(objectId(createdUser.data!.id))
  const storedUser = await db.collection('users').findOne({ _id: ids.users[0] })
  assert.equal(storedUser?.storeId, SINGLE_STORE_ID)
  assert.equal(storedUser?.isActive, true)
  assert.notEqual(storedUser?.passwordHash, userPassword)

  userCookie = await login(userUsername, userPassword)
  assert.equal((await api('/api/users', { cookie: userCookie })).status, 403)

  const logout = await api('/api/auth/logout', { method: 'POST', cookie: userCookie })
  assert.equal(logout.status, 200)
  assert.match(logout.setCookie ?? '', /Max-Age=0/i)
  assert.match(logout.setCookie ?? '', /HttpOnly/i)
  assert.match(logout.setCookie ?? '', /Secure/i)
  assert.match(logout.setCookie ?? '', /SameSite=Lax/i)
  assert.equal((await api('/api/auth/me', { cookie: logout.setCookie!.split(';')[0] })).status, 401)
  userCookie = await login(userUsername, userPassword)
})

test('cadastros, venda, estoque, rollback por estoque insuficiente e cancelamento idempotente', async () => {
  const customer = await api<Entity>('/api/customers', { method: 'POST', cookie: adminCookie, body: { name: customerName, addresses: [] } })
  assert.equal(customer.status, 201, customer.message)
  ids.customers.push(objectId(customer.data!.id))

  const employee = await api<Entity>('/api/employees', { method: 'POST', cookie: adminCookie, body: { name: employeeName, role: 'Vendedor', active: true } })
  assert.equal(employee.status, 201, employee.message)
  ids.employees.push(objectId(employee.data!.id))

  const inventory = await api<Inventory>('/api/inventories', {
    method: 'POST',
    cookie: adminCookie,
    body: {
      productName, brand: '', category: 'GERAL', unit: 'UN', costPrice: 5, profitPercentage: 100,
      salePrice: 10, currentStock: 5, reservedStock: 0, location: 'HOMOLOGACAO', supplier: 'SINTETICO',
    },
  })
  assert.equal(inventory.status, 201, inventory.message)
  ids.inventories.push(objectId(inventory.data!.id))
  ids.products.push(objectId(inventory.data!.productId))

  const inventoryFromApi = await api<Inventory>(`/api/inventories/${inventory.data!.id}`, { cookie: userCookie })
  assert.equal(inventoryFromApi.status, 200)
  assert.equal(inventoryFromApi.data?.currentStock, 5)
  assert.equal((await db.collection('inventories').findOne({ _id: ids.inventories[0] }))?.storeId, SINGLE_STORE_ID)

  const sale = await api<Sale>('/api/sales', {
    method: 'POST', cookie: userCookie,
    body: salePayload(inventory.data!, customer.data!.id, employee.data!.id, 'VENDA-VALIDA', 2),
  })
  assert.equal(sale.status, 201, sale.message)
  ids.sales.push(objectId(sale.data!.id))
  const storedSale = await db.collection('sales').findOne({ _id: ids.sales[0] })
  const stockAfterSale = await db.collection('inventories').findOne({ _id: ids.inventories[0] })
  const saleMovement = await db.collection('inventorymovements').findOne({ itemId: inventory.data!.id, actorId: ids.users[0] })
  assert.equal(storedSale?.storeId, SINGLE_STORE_ID)
  assert.equal(stockAfterSale?.currentStock, 3)
  assert.ok(saleMovement)
  assert.equal(saleMovement?.storeId, SINGLE_STORE_ID)

  const salesBeforeFailure = await db.collection('sales').countDocuments({ notes: `${marker}-ESTOQUE-INSUFICIENTE` })
  const movementsBeforeFailure = await db.collection('inventorymovements').countDocuments({ itemId: inventory.data!.id })
  const insufficient = await api<Sale>('/api/sales', {
    method: 'POST', cookie: userCookie,
    body: salePayload(inventory.data!, customer.data!.id, employee.data!.id, 'ESTOQUE-INSUFICIENTE', 99),
  })
  assert.equal(insufficient.status, 409, insufficient.message)
  assert.equal(await db.collection('sales').countDocuments({ notes: `${marker}-ESTOQUE-INSUFICIENTE` }), salesBeforeFailure)
  assert.equal(await db.collection('inventorymovements').countDocuments({ itemId: inventory.data!.id }), movementsBeforeFailure)
  assert.equal((await db.collection('inventories').findOne({ _id: ids.inventories[0] }))?.currentStock, 3)

  assert.equal((await api(`/api/sales/${sale.data!.id}/cancel`, { method: 'POST', cookie: adminCookie })).status, 200)
  assert.equal((await db.collection('inventories').findOne({ _id: ids.inventories[0] }))?.currentStock, 5)
  assert.equal((await api(`/api/sales/${sale.data!.id}/cancel`, { method: 'POST', cookie: userCookie })).status, 200)
  assert.equal((await db.collection('inventories').findOne({ _id: ids.inventories[0] }))?.currentStock, 5)
  const cancelled = await db.collection('sales').findOne({ _id: ids.sales[0] })
  assert.equal(cancelled?.status, 'CANCELLED')
  assert.equal(cancelled?.history.filter((entry: { action: string }) => entry.action === 'CANCELLED').length, 1)
})
