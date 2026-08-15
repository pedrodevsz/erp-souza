import assert from 'node:assert/strict'
import test from 'node:test'

import { determineStatus, mimeTypeFromBuffer, similarityScore } from './import-invoice.service'

test('mimeTypeFromBuffer recognizes pdf and common image signatures', () => {
  assert.equal(mimeTypeFromBuffer(Buffer.from('%PDF-1.7\n')), 'application/pdf')
  assert.equal(mimeTypeFromBuffer(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png')
  assert.equal(mimeTypeFromBuffer(Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'image/jpeg')
})

test('similarityScore favors close product names', () => {
  const close = similarityScore('CABO FLEXIVEL 2,5MM SIL', 'CABO FLEX 2.5 MM SIL')
  const far = similarityScore('CABO FLEXIVEL 2,5MM SIL', 'CIMENTO 50KG')

  assert.ok(close > far)
  assert.ok(close > 0.5)
})

test('determineStatus requires exact matches and no warnings', () => {
  const baseItem = {
    description: 'CIMENTO CP II',
    productName: 'CIMENTO CP II',
    quantity: 1,
    unit: 'SC',
    unitPrice: 100,
    discount: 0,
    subtotal: 100,
  }

  assert.equal(determineStatus([{ ...baseItem, matchStatus: 'exact' }], []), 'ready_for_review')
  assert.equal(determineStatus([{ ...baseItem, matchStatus: 'similar' }], []), 'review_required')
  assert.equal(determineStatus([{ ...baseItem, matchStatus: 'exact' }], [{ message: 'revisar' }]), 'review_required')
})
