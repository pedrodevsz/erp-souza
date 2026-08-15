import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI

if (!uri) {
  console.error('MONGODB_URI não configurada.')
  process.exit(1)
}

function normalizeText(value) {
  if (typeof value !== 'string') return value
  return value.trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR')
}

function normalizeDocument(value) {
  if (typeof value !== 'string') return value
  return value.replace(/\D/g, '')
}

function normalizeAddress(address) {
  if (!address || typeof address !== 'object') return address

  return {
    ...address,
    street: normalizeText(address.street),
    number: normalizeText(address.number),
    complement: normalizeText(address.complement),
    district: normalizeText(address.district),
    city: normalizeText(address.city),
    state: normalizeText(address.state),
  }
}

function normalizePurchaseItem(item) {
  return {
    ...item,
    productName: normalizeText(item.productName),
    brand: normalizeText(item.brand),
    product: normalizeText(item.product),
    category: normalizeText(item.category),
    unit: normalizeText(item.unit),
  }
}

function normalizeSaleItem(item) {
  return {
    ...item,
    productName: normalizeText(item.productName),
    brand: normalizeText(item.brand),
    product: normalizeText(item.product),
    sku: normalizeText(item.sku),
    unit: normalizeText(item.unit),
  }
}

async function bulkNormalize(collectionName, mapper) {
  const collection = mongoose.connection.collection(collectionName)
  const cursor = collection.find({})
  const ops = []

  for await (const doc of cursor) {
    const next = mapper(doc)
    if (JSON.stringify(next) === JSON.stringify(doc)) continue
    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: next },
      },
    })

    if (ops.length >= 250) {
      await collection.bulkWrite(ops, { ordered: false })
      ops.length = 0
    }
  }

  if (ops.length > 0) {
    await collection.bulkWrite(ops, { ordered: false })
  }
}

async function main() {
  await mongoose.connect(uri)

  await bulkNormalize('customers', (doc) => ({
    ...doc,
    name: normalizeText(doc.name),
    document: normalizeDocument(doc.document),
    phone: normalizeText(doc.phone),
    paymentMethod: normalizeText(doc.paymentMethod),
    notes: normalizeText(doc.notes),
    addresses: Array.isArray(doc.addresses) ? doc.addresses.map(normalizeAddress) : doc.addresses,
  }))

  await bulkNormalize('products', (doc) => ({
    ...doc,
    name: normalizeText(doc.name),
    unit: normalizeText(doc.unit),
    brand: normalizeText(doc.brand),
    product: normalizeText(doc.product),
  }))

  await bulkNormalize('suppliers', (doc) => ({
    ...doc,
    name: normalizeText(doc.name),
  }))

  await bulkNormalize('inventorycategories', (doc) => ({
    ...doc,
    name: normalizeText(doc.name),
  }))

  await bulkNormalize('inventories', (doc) => ({
    ...doc,
    productName: normalizeText(doc.productName),
    brand: normalizeText(doc.brand),
    product: normalizeText(doc.product),
    sku: normalizeText(doc.sku),
    category: normalizeText(doc.category),
    unit: normalizeText(doc.unit),
    location: normalizeText(doc.location),
    supplier: normalizeText(doc.supplier),
    notes: normalizeText(doc.notes),
  }))

  await bulkNormalize('purchases', (doc) => ({
    ...doc,
    supplier: normalizeText(doc.supplier),
    expectedDelivery: normalizeText(doc.expectedDelivery),
    paymentCondition: normalizeText(doc.paymentCondition),
    paymentMethod: normalizeText(doc.paymentMethod),
    invoiceNumber: normalizeText(doc.invoiceNumber),
    notes: normalizeText(doc.notes),
    items: Array.isArray(doc.items) ? doc.items.map(normalizePurchaseItem) : doc.items,
  }))

  await bulkNormalize('sales', (doc) => ({
    ...doc,
    customerName: normalizeText(doc.customerName),
    sellerName: normalizeText(doc.sellerName),
    paymentMethod: normalizeText(doc.paymentMethod),
    paymentCondition: normalizeText(doc.paymentCondition),
    notes: normalizeText(doc.notes),
    items: Array.isArray(doc.items) ? doc.items.map(normalizeSaleItem) : doc.items,
    history: Array.isArray(doc.history)
      ? doc.history.map((entry) => ({
          ...entry,
          description: normalizeText(entry.description),
          user: normalizeText(entry.user),
        }))
      : doc.history,
  }))

  await bulkNormalize('productreservations', (doc) => ({
    ...doc,
    productName: normalizeText(doc.productName),
    product: normalizeText(doc.product),
    sku: normalizeText(doc.sku),
    unit: normalizeText(doc.unit),
    customerName: normalizeText(doc.customerName),
  }))

  await bulkNormalize('inventorymovements', (doc) => ({
    ...doc,
    type: normalizeText(doc.type),
    description: normalizeText(doc.description),
    user: normalizeText(doc.user),
  }))

  await mongoose.disconnect()
  console.log('Normalização para UPPERCASE concluída com sucesso.')
}

main().catch(async (error) => {
  console.error('Falha na migração de uppercase:', error)
  try {
    await mongoose.disconnect()
  } catch {}
  process.exit(1)
})
