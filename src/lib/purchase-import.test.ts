import assert from 'node:assert/strict'
import test from 'node:test'

import { PURCHASE_IMPORT_UNAVAILABLE_MESSAGE, PURCHASE_MANUAL_ROUTE } from './purchase-import'

test('mantém o contrato temporário de fallback da importação de nota', () => {
  assert.equal(PURCHASE_MANUAL_ROUTE, '/dashboard/purchases/new')
  assert.match(PURCHASE_IMPORT_UNAVAILABLE_MESSAGE, /temporariamente indisponível/)
  assert.match(PURCHASE_IMPORT_UNAVAILABLE_MESSAGE, /preenchimento manual/)
})
