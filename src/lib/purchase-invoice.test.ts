import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatPurchaseInvoiceFileSize,
  getPurchaseInvoiceFileExtension,
  isAllowedPurchaseInvoiceExtension,
  isAllowedPurchaseInvoiceMimeType,
} from './purchase-invoice'

test('purchase invoice file helpers recognize valid formats', () => {
  assert.equal(getPurchaseInvoiceFileExtension('nota-fiscal.PDF'), 'pdf')
  assert.equal(isAllowedPurchaseInvoiceExtension('jpg'), true)
  assert.equal(isAllowedPurchaseInvoiceExtension('txt'), false)
  assert.equal(isAllowedPurchaseInvoiceMimeType('application/pdf'), true)
  assert.equal(isAllowedPurchaseInvoiceMimeType('text/plain'), false)
  assert.equal(formatPurchaseInvoiceFileSize(1536), '1.5 KB')
})
