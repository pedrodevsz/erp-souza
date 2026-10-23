import { loadEnvConfig } from '@next/env'
import { MongoClient } from 'mongodb'

import { redactMongoUri, validateHomologationUri } from './homologation-target'

loadEnvConfig(process.cwd())

async function main() {
  const uri = process.env.MONGODB_URI
  const { database } = validateHomologationUri(uri)
  const client = new MongoClient(uri!, { appName: 'erp-souza-homolog-read-only-check' })

  await client.connect()
  try {
    const db = client.db(database)
    await db.command({ ping: 1 })
    const hello = await db.admin().command({ hello: 1 }) as { setName?: string; msg?: string; isWritablePrimary?: boolean }
    const collections = await db.listCollections({}, { nameOnly: true }).toArray()
    console.log(JSON.stringify({
      database,
      connected: true,
      topologySupportsTransactions: Boolean(hello.setName || hello.msg === 'isdbgrid'),
      writablePrimary: hello.isWritablePrimary === true || hello.msg === 'isdbgrid',
      existingCollectionCount: collections.length,
      requiresPurposeConfirmationBeforeWrites: collections.length > 0,
    }, null, 2))
  } finally {
    await client.close()
  }
}

main().catch((error: unknown) => {
  console.error(redactMongoUri(error instanceof Error ? error.message : 'Falha ao verificar homologacao.'))
  process.exitCode = 1
})
