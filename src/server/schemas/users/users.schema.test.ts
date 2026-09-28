import assert from 'node:assert/strict'
import test from 'node:test'

import { userCreateSchema, userUpdateSchema } from './users.schema'

test('userCreateSchema normaliza username e força contrato sem role', () => {
  const parsed = userCreateSchema.parse({
    username: 'loja souza',
    password: 'SenhaSegura123$',
  })

  assert.equal(parsed.username, 'LOJA SOUZA')
  assert.equal('role' in parsed, false)
  assert.equal(userCreateSchema.safeParse({ username: 'salete', password: 'Senha123$', role: 'ADMIN' }).success, false)
})

test('userUpdateSchema permite somente senha e status', () => {
  assert.equal(userUpdateSchema.safeParse({ password: 'NovaSenha123$' }).success, true)
  assert.equal(userUpdateSchema.safeParse({ isActive: false }).success, true)
  assert.equal(userUpdateSchema.safeParse({ role: 'ADMIN' }).success, false)
  assert.equal(userUpdateSchema.safeParse({}).success, false)
})
