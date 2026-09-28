import assert from 'node:assert/strict'
import test from 'node:test'

import { hashPassword, verifyPassword } from './password'

test('verifyPassword compara a senha exatamente como recebida', async () => {
  const password = ' Senha@2026$ '
  const passwordHash = await hashPassword(password)

  assert.equal(await verifyPassword(password, passwordHash), true)
  assert.equal(await verifyPassword(password.trim(), passwordHash), false)
  assert.equal(await verifyPassword('Senha@2026$', passwordHash), false)
})
