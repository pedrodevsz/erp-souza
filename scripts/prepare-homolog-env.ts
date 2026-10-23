import { randomBytes, randomUUID } from 'node:crypto'
import { chmod, open, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { loadEnvConfig } from '@next/env'

import { HOMOLOGATION_DATABASE } from './homologation-target'

const destination = path.join(process.cwd(), '.env.homolog.local')

function quoted(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n')}"`
}

function line(key: string, value: string | undefined) {
  return value ? `${key}=${quoted(value)}\n` : ''
}

async function prepare() {
  loadEnvConfig(process.cwd())
  const sourceUri = process.env.MONGODB_URI
  if (!sourceUri) throw new Error('MONGODB_URI nao encontrada nos arquivos locais.')

  const uri = new URL(sourceUri)
  if (!['mongodb:', 'mongodb+srv:'].includes(uri.protocol)) throw new Error('Protocolo da MONGODB_URI invalido.')
  uri.pathname = `/${HOMOLOGATION_DATABASE}`
  uri.searchParams.delete('dbName')

  const content = [
    '# Gerado localmente. Nao versionar nem compartilhar.\n',
    line('APP_ENV', 'homologation'),
    line('MONGODB_URI', uri.toString()),
    line('AUTH_SECRET', randomBytes(48).toString('base64url')),
    line('OPENAI_API_KEY', process.env.OPENAI_API_KEY),
    line('OPENAI_MODEL', process.env.OPENAI_MODEL),
    'HOMOLOGATION_DATABASE_CONFIRMED=\n',
    line('HOMOLOG_ADMIN_USERNAME', `HOMOLOG_ADMIN_${randomUUID().slice(0, 8)}`),
    line('HOMOLOG_ADMIN_PASSWORD', randomBytes(32).toString('base64url')),
    line('HOMOLOGATION_BASE_URL', 'https://erp-souza.local:8443'),
  ].join('')

  const handle = await open(destination, 'wx', 0o600)
  try {
    await handle.writeFile(content, { encoding: 'utf8' })
  } finally {
    await handle.close()
  }
  await chmod(destination, 0o600)
  console.log(JSON.stringify({ created: true, file: '.env.homolog.local', database: HOMOLOGATION_DATABASE, mode: '0600' }))
}

async function confirm() {
  const current = await readFile(destination, 'utf8')
  const expected = 'HOMOLOGATION_DATABASE_CONFIRMED='
  if (!current.includes(expected)) throw new Error('Variavel de confirmacao ausente no arquivo de homologacao.')
  const next = current.replace(/^HOMOLOGATION_DATABASE_CONFIRMED=.*$/m, `HOMOLOGATION_DATABASE_CONFIRMED=${HOMOLOGATION_DATABASE}`)
  const temporary = `${destination}.tmp-${process.pid}`
  await writeFile(temporary, next, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
  await rename(temporary, destination)
  await chmod(destination, 0o600)
  console.log(JSON.stringify({ confirmed: true, file: '.env.homolog.local', database: HOMOLOGATION_DATABASE }))
}

const action = process.argv[2]
const task = action === '--confirm-database' ? confirm() : action ? Promise.reject(new Error(`Argumento nao suportado: ${action}`)) : prepare()
task.catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Falha ao preparar ambiente de homologacao.')
  process.exitCode = 1
})
