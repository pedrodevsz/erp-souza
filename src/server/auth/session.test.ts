import assert from 'node:assert/strict'
import test from 'node:test'

import { createSessionToken, verifySessionToken } from './session'

process.env.AUTH_SECRET = 'test-auth-secret'

test('sessão usa username no contrato e preserva o identificador normalizado', async () => {
  const token = await createSessionToken({
    userId: 'user-1',
    username: 'SALETE',
    role: 'ADMIN',
  })

  assert.deepEqual(await verifySessionToken(token), {
    userId: 'user-1',
    username: 'SALETE',
    role: 'ADMIN',
  })
})

test('sessão rejeita tokens malformados ou com segmentos extras sem lançar erro', async () => {
  assert.equal(await verifySessionToken('x.y'), null)
  assert.equal(await verifySessionToken('a.b.c'), null)
  assert.equal(await verifySessionToken('apenas-um-segmento'), null)
})
