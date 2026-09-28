import assert from 'node:assert/strict'
import test from 'node:test'
import { getDuplicateKeyDiagnostics, isUsernameDuplicateError } from './user-errors'

test('somente conflito no índice username vira conflito de username', () => {
  assert.equal(isUsernameDuplicateError({ code: 11000, keyPattern: { username: 1 } }), true)
  assert.equal(isUsernameDuplicateError({ code: 11000, index: 'username_1' }), true)
  assert.equal(isUsernameDuplicateError({ code: 11000, keyPattern: { name: 1 } }), false)
  assert.equal(isUsernameDuplicateError({ code: 11000, index: 'name_1' }), false)
})

test('diagnóstico não inclui valor do índice', () => {
  assert.deepEqual(getDuplicateKeyDiagnostics({ code: 11000, index: 'name_1', keyPattern: { name: 1 }, keyValue: { name: 'segredo' } }), { index: 'name_1', keyPattern: { name: 1 } })
})
