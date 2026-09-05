import assert from 'node:assert/strict'
import test from 'node:test'

import { purchaseCreateSchema } from '@/server/schemas/purchases/purchases.schema'

function buildBasePurchaseItem(overrides: Record<string, unknown> = {}) {
  return {
    productName: 'AREIA MÉDIA',
    brand: '',
    product: 'AREIA MÉDIA M²',
    category: 'geral',
    quantity: 12,
    unit: 'M²',
    unitPrice: 50,
    profitPercentage: 50,
    salePrice: 75,
    discount: 0,
    ...overrides,
  }
}

test('purchaseCreateSchema aceita item com brand vazio ou ausente', () => {
  const withEmptyBrand = purchaseCreateSchema.safeParse({
    supplier: 'PADEIRO',
    purchaseDate: '2026-09-04T00:00:00.000Z',
    paymentCondition: [],
    discounts: 0,
    freight: 0,
    otherExpenses: 0,
    items: [buildBasePurchaseItem({ brand: '' })],
  })

  const withoutBrand = purchaseCreateSchema.safeParse({
    supplier: 'PADEIRO',
    purchaseDate: '2026-09-04T00:00:00.000Z',
    paymentCondition: [],
    discounts: 0,
    freight: 0,
    otherExpenses: 0,
    items: [buildBasePurchaseItem({ brand: undefined })],
  })

  assert.equal(withEmptyBrand.success, true)
  assert.equal(withoutBrand.success, true)
})
