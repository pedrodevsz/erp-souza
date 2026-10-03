import assert from 'node:assert/strict'
import test from 'node:test'

import { INTEGRATION_TEST_DATABASE, validateDestructiveMongoTestTarget, validateMongoTestTarget } from './helpers/mongodb-test-target'

const validUri = `mongodb://127.0.0.1:27018/${INTEGRATION_TEST_DATABASE}?replicaSet=rs0&directConnection=true`

test('recusa ausencia de URI de teste sem fallback para desenvolvimento', () => {
  assert.throws(() => validateMongoTestTarget(undefined), /MONGODB_TEST_URI/)
})

test('recusa exatamente a URI de desenvolvimento quando tambem fornecida', () => {
  assert.throws(() => validateMongoTestTarget(validUri, validUri), /nao pode ser igual/)
})

test('recusa Atlas e hosts remotos mesmo com database de teste no nome', () => {
  const remote = validUri.replace('127.0.0.1:27018', 'cluster.example.mongodb.net')
  assert.throws(() => validateMongoTestTarget(remote), /somente MongoDB local/)
})

test('recusa database sem identificacao exata de teste ou replica set ausente', () => {
  assert.throws(() => validateMongoTestTarget(validUri.replace(INTEGRATION_TEST_DATABASE, 'erp_souza')), /Database de teste/)
  assert.throws(() => validateMongoTestTarget(validUri.replace('?replicaSet=rs0&', '?')), /replicaSet=rs0/)
})

test('aceita somente o destino local de integracao explicitamente identificado', () => {
  assert.deepEqual(validateMongoTestTarget(validUri), { host: '127.0.0.1', database: INTEGRATION_TEST_DATABASE })
})

test('execucao destrutiva exige nonce forte fornecido pelo runner', () => {
  assert.throws(() => validateDestructiveMongoTestTarget(validUri, undefined), /ERP_INTEGRATION_RUN_ID/)
  assert.throws(() => validateDestructiveMongoTestTarget(validUri, 'true'), /ERP_INTEGRATION_RUN_ID/)
  assert.equal(validateDestructiveMongoTestTarget(validUri, '12345678-1234-1234-1234-123456789abc').runId, '12345678-1234-1234-1234-123456789abc')
})
