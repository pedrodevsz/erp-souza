import { loadEnvConfig } from '@next/env'
import mongoose from 'mongoose'

import { CustomerModel } from '@/server/models/customers/customers.model'

loadEnvConfig(process.cwd())

const MONGODB_URI = process.env.MONGODB_URI

type CustomerIndex = {
  name?: string
  key?: Record<string, 1 | -1 | string>
  unique?: boolean
  partialFilterExpression?: Record<string, unknown>
}

function normalizeDigits(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.replace(/\D/g, '')
  return normalized.length > 0 ? normalized : null
}

function isExactKey(index: CustomerIndex, expected: Record<string, 1>) {
  const key = index.key ?? {}
  const actualEntries = Object.entries(key)
  const expectedEntries = Object.entries(expected)

  if (actualEntries.length !== expectedEntries.length) {
    return false
  }

  return expectedEntries.every(([field, direction]) => key[field] === direction)
}

function hasDesiredDocumentIndex(index: CustomerIndex) {
  return (
    index.name === 'customer_user_document_unique' &&
    index.unique === true &&
    isExactKey(index, { userId: 1, document: 1 }) &&
    index.partialFilterExpression?.document &&
    typeof index.partialFilterExpression.document === 'object' &&
    (index.partialFilterExpression.document as { $type?: unknown }).$type === 'string'
  )
}

function shouldDropIndex(index: CustomerIndex) {
  if (!index.name || index.name === '_id_') {
    return false
  }

  if (hasDesiredDocumentIndex(index)) {
    return false
  }

  if (index.name === 'customer_user_lookup') {
    return false
  }

  if (isExactKey(index, { userId: 1 }) && index.name !== 'customer_user_lookup') return true
  if (index.unique && isExactKey(index, { name: 1 })) return true
  if (index.unique && isExactKey(index, { phone: 1 })) return true
  if (index.unique && isExactKey(index, { document: 1 })) return true
  if (index.unique && isExactKey(index, { userId: 1, phone: 1 })) return true

  return false
}

async function normalizeLegacyCustomerData() {
  const cursor = CustomerModel.find({}, { phone: 1, document: 1 }).lean().cursor()
  const bulkOps: mongoose.AnyBulkWriteOperation[] = []
  let updated = 0

  for await (const customer of cursor) {
    const nextPhone = normalizeDigits((customer as { phone?: unknown }).phone)
    const nextDocument = normalizeDigits((customer as { document?: unknown }).document)
    const update: Record<string, string | null> = {}
    const currentPhone = (customer as { phone?: unknown }).phone
    const currentDocument = (customer as { document?: unknown }).document

    if (currentPhone !== nextPhone) {
      update.phone = nextPhone
    }

    if (currentDocument !== nextDocument) {
      update.document = nextDocument
    }

    if (Object.keys(update).length === 0) {
      continue
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: (customer as { _id: mongoose.Types.ObjectId })._id },
        update: { $set: update },
      },
    })

    if (bulkOps.length >= 250) {
      const result = await CustomerModel.bulkWrite(bulkOps, { ordered: false })
      updated += result.modifiedCount
      bulkOps.length = 0
    }
  }

  if (bulkOps.length > 0) {
    const result = await CustomerModel.bulkWrite(bulkOps, { ordered: false })
    updated += result.modifiedCount
  }

  return updated
}

async function main() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI não encontrada no ambiente.')
  }

  await mongoose.connect(MONGODB_URI)

  const currentIndexes = (await CustomerModel.collection.indexes()) as CustomerIndex[]
  console.log('Índices atuais:')
  console.log(JSON.stringify(currentIndexes, null, 2))

  const indexesToDrop = currentIndexes.filter(shouldDropIndex)
  if (indexesToDrop.length > 0) {
    console.log('Removendo índices incorretos:')
    console.log(JSON.stringify(indexesToDrop.map((index) => index.name), null, 2))

    for (const index of indexesToDrop) {
      if (!index.name) {
        continue
      }

      await CustomerModel.collection.dropIndex(index.name)
    }
  } else {
    console.log('Nenhum índice incorreto encontrado.')
  }

  const updatedCount = await normalizeLegacyCustomerData()
  console.log(`Documentos normalizados: ${updatedCount}`)

  await CustomerModel.syncIndexes()

  const finalIndexes = (await CustomerModel.collection.indexes()) as CustomerIndex[]
  console.log('Índices finais:')
  console.log(JSON.stringify(finalIndexes, null, 2))

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error('Falha ao corrigir índices de clientes:', error)

  try {
    await mongoose.disconnect()
  } catch {
    // ignore disconnect errors
  }

  process.exitCode = 1
})
