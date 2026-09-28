import assert from 'node:assert/strict'
import test from 'node:test'

import { authLoginSchema, passwordSchema } from './auth.schema'

test('passwordSchema aceita senhas livres entre 8 e 128 caracteres', () => {
  for (const password of ['Lojasouza100%', 'Senha@2026', 'abcdefgh', '12345678', 'abcDEF123!']) {
    assert.equal(passwordSchema.safeParse(password).success, true, password)
  }

  assert.equal(passwordSchema.safeParse('a'.repeat(128)).success, true)
  assert.equal(passwordSchema.safeParse('a'.repeat(129)).success, false)
  assert.equal(passwordSchema.safeParse('1234567').success, false)
})

test('passwordSchema aceita símbolos e espaços sem transformar a senha', () => {
  const password = 'Senha @2026$'
  const parsed = authLoginSchema.parse({ username: ' usuario ', password })

  assert.equal(parsed.username, 'USUARIO')
  assert.equal(parsed.password, password)
})

test('authLoginSchema normaliza username sem aceitar o campo legado name', () => {
  for (const username of ['salete', 'SALETE', 'SaLeTe', 'loja souza']) {
    const parsed = authLoginSchema.parse({ username, password: 'Eusoupedrodev12$' })
    assert.equal(parsed.username, username === 'loja souza' ? 'LOJA SOUZA' : 'SALETE')
  }

  const legacyPayload = authLoginSchema.safeParse({ name: 'salete', password: 'Eusoupedrodev12$' })
  assert.equal(legacyPayload.success, false)
})

test('authLoginSchema mantém mensagem genérica para senha curta', () => {
  const result = passwordSchema.safeParse('abc')

  assert.equal(result.success, false)
  if (!result.success) {
    assert.equal(result.error.issues[0]?.message, 'A senha deve ter entre 8 e 128 caracteres.')
  }
})
