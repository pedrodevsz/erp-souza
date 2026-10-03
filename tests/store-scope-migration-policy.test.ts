import assert from 'node:assert/strict'
import test from 'node:test'

import { assertAuthorizedUsers, assertMatchedCount, assertMigrationAuthorized } from '../scripts/store-scope-migration-policy'

const authorization = {
  target: 'rehearsal' as const,
  database: 'erp_souza_rehearsal',
  backupConfirmed: true,
  rehearsalConfirmed: false,
  approvalNote: 'Backup restaurado e conferido no rehearsal.',
}

const emptyBlockers = { supplierConflicts: [], missingSaleProductReferences: [], divergentStores: [] }

test('migration aborta apply quando existe qualquer blocker, inclusive store divergente', () => {
  assert.throws(() => assertMigrationAuthorized({
    target: 'rehearsal', database: authorization.database,
    confirmation: 'APPLY_STORE_SCOPE_TO_DISPOSABLE_REHEARSAL', authorization,
    blockers: { ...emptyBlockers, divergentStores: [{ collection: 'sales', storeId: 'store-b' }] },
  }), /Apply bloqueado/)
})

test('migration exige destino, backup, nota e confirmacao forte correspondentes', () => {
  assert.throws(() => assertMigrationAuthorized({
    target: 'rehearsal', database: authorization.database, confirmation: 'true', authorization, blockers: emptyBlockers,
  }), /Confirmacao forte/)
  assert.throws(() => assertMigrationAuthorized({
    target: 'rehearsal', database: authorization.database, confirmation: 'APPLY_STORE_SCOPE_TO_DISPOSABLE_REHEARSAL',
    authorization: { ...authorization, backupConfirmed: false }, blockers: emptyBlockers,
  }), /Backup restauravel/)
})

test('production apply exige rehearsal confirmado e token especifico', () => {
  const production = { ...authorization, target: 'production' as const, database: 'erp_souza', rehearsalConfirmed: false }
  assert.throws(() => assertMigrationAuthorized({
    target: 'production', database: production.database,
    confirmation: 'APPLY_STORE_SCOPE_TO_PRODUCTION_AFTER_BACKUP_AND_REHEARSAL', authorization: production, blockers: emptyBlockers,
  }), /Rehearsal aprovado/)
})

test('usuarios autorizados precisam existir, estar ativos, ter papel permitido e nao pertencer a outra loja', () => {
  const valid = [{ _id: 'a', isActive: true, role: 'ADMIN', storeId: 'store-a' }]
  assert.doesNotThrow(() => assertAuthorizedUsers(valid, ['a'], 'store-a'))
  assert.throws(() => assertAuthorizedUsers([], ['a'], 'store-a'), /nao foram encontrados/)
  assert.throws(() => assertAuthorizedUsers([{ ...valid[0], isActive: false }], ['a'], 'store-a'), /ativo/)
  assert.throws(() => assertAuthorizedUsers([{ ...valid[0], storeId: 'store-b' }], ['a'], 'store-a'), /outra loja/)
})

test('matchedCount divergente aborta a migration', () => {
  assert.doesNotThrow(() => assertMatchedCount(2, 2))
  assert.throws(() => assertMatchedCount(1, 2), /Quantidade atualizada divergente/)
})
