import { loadEnvConfig } from '@next/env'
import mongoose from 'mongoose'

loadEnvConfig(process.cwd())

const MONGODB_URI = process.env.MONGODB_URI
const LEGACY_OWNER_USER_ID = process.env.LEGACY_OWNER_USER_ID
const LEGACY_OWNER_ADMIN_USERNAME = process.env.LEGACY_OWNER_ADMIN_USERNAME ?? process.env.LEGACY_OWNER_USER_NAME

const COLLECTIONS = [
  'products',
  'purchases',
  'sales',
  'customers',
  'inventories',
  'inventorymovements',
  'deliveries',
  'suppliers',
  'employees',
  'inventorycategories',
  'productreservations',
]

async function resolveOwnerId() {
  if (LEGACY_OWNER_USER_ID && mongoose.isValidObjectId(LEGACY_OWNER_USER_ID)) {
    const byId = await mongoose.connection.collection('users').findOne({ _id: new mongoose.Types.ObjectId(LEGACY_OWNER_USER_ID) })
    if (byId) {
      return String(byId._id)
    }
  }

  if (LEGACY_OWNER_ADMIN_USERNAME?.trim()) {
    const byName = await mongoose.connection.collection('users').findOne({ name: LEGACY_OWNER_ADMIN_USERNAME.trim() })
    if (byName) {
      return String(byName._id)
    }
  }

  throw new Error('Defina LEGACY_OWNER_USER_ID ou LEGACY_OWNER_ADMIN_USERNAME para associar os registros antigos.')
}

async function main() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI não encontrada no ambiente.')
  }

  await mongoose.connect(MONGODB_URI)

  const ownerId = await resolveOwnerId()
  const ownerObjectId = new mongoose.Types.ObjectId(ownerId)

  for (const collectionName of COLLECTIONS) {
    const result = await mongoose.connection.collection(collectionName).updateMany(
      {
        $or: [{ userId: { $exists: false } }, { userId: null }],
      },
      {
        $set: { userId: ownerObjectId },
      }
    )

    console.log(`${collectionName}: ${result.modifiedCount} documentos atualizados.`)
  }

  await mongoose.disconnect()
}

main().catch(async (error) => {
  console.error(error)
  try {
    await mongoose.disconnect()
  } catch {
    // ignore disconnect errors
  }
  process.exitCode = 1
})
