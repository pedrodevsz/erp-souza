import assert from 'node:assert/strict'
import test from 'node:test'

import { AppError } from '@/server/errors/app-error'
import { resolveStoreContextForUser, SINGLE_STORE_ID } from './store-context'

test('resolve contexto para usuario ativo associado explicitamente a uma loja', () => {
  const context = resolveStoreContextForUser({ _id: 'actor-1', storeId: SINGLE_STORE_ID, role: 'USER', isActive: true })
  assert.deepEqual(context, { storeId: SINGLE_STORE_ID, actorId: 'actor-1', role: 'USER' })
})

test('aceita loja alternativa explicita para provar isolamento nos services sem tenant switching na UI', () => {
  const context = resolveStoreContextForUser({ _id: 'actor-b', storeId: 'store-b-security-test', role: 'ADMIN', isActive: true })
  assert.deepEqual(context, { storeId: 'store-b-security-test', actorId: 'actor-b', role: 'ADMIN' })
})

test('recusa usuario ativo sem associacao com a loja', () => {
  assert.throws(
    () => resolveStoreContextForUser({ _id: 'actor-2', role: 'USER', isActive: true }),
    (error: unknown) => error instanceof AppError && error.statusCode === 403
  )
})

test('recusa usuario desativado antes de liberar a loja', () => {
  assert.throws(
    () => resolveStoreContextForUser({ _id: 'actor-3', storeId: SINGLE_STORE_ID, role: 'ADMIN', isActive: false }),
    (error: unknown) => error instanceof AppError && error.statusCode === 401
  )
})
