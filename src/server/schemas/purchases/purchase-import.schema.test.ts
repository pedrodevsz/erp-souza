import assert from 'node:assert/strict'
import test from 'node:test'

import { purchaseImportResponseSchema } from './purchase-import.schema'

test('purchase import response schema accepts a structured payload', () => {
  const result = purchaseImportResponseSchema.safeParse({
    status: 'ready_for_review',
    purchase: {
      supplierId: null,
      supplier: 'FORNECEDOR TESTE',
      supplierDocument: null,
      invoiceNumber: '',
      invoiceAccessKey: '',
      purchaseDate: '2026-07-22T00:00:00.000Z',
      expectedDelivery: '',
      paymentCondition: [],
      paymentMethod: '',
      subtotal: 100,
      discounts: 0,
      freight: 0,
      otherExpenses: 0,
      total: 100,
      items: [
        {
          supplierCode: null,
          barcode: null,
          description: 'CIMENTO CP II',
          productName: 'CIMENTO CP II',
          brand: null,
          category: null,
          quantity: 1,
          unit: 'SC',
          unitPrice: 100,
          discount: 0,
          subtotal: 100,
          productId: null,
          product: null,
          salePrice: 150,
          profitPercentage: 50,
          matchStatus: 'not_found',
          matchConfidence: 0.5,
          suggestedProducts: [],
        },
      ],
    },
    warnings: [],
    summary: {
      totalItems: 1,
      matchedItems: 0,
      reviewItems: 1,
      notFoundItems: 1,
    },
  })

  assert.equal(result.success, true)
})

test('purchase import response schema rejects missing item fields', () => {
  const result = purchaseImportResponseSchema.safeParse({
    status: 'review_required',
    purchase: {
      supplierId: null,
      supplier: 'FORNECEDOR TESTE',
      supplierDocument: null,
      invoiceNumber: '',
      invoiceAccessKey: '',
      purchaseDate: '2026-07-22T00:00:00.000Z',
      expectedDelivery: '',
      paymentCondition: [],
      paymentMethod: '',
      subtotal: 100,
      discounts: 0,
      freight: 0,
      otherExpenses: 0,
      total: 100,
      items: [],
    },
    warnings: [],
    summary: {
      totalItems: 0,
      matchedItems: 0,
      reviewItems: 0,
      notFoundItems: 0,
    },
  })

  assert.equal(result.success, false)
})
