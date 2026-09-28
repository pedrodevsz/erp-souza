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
    paymentCondition: [],
    discounts: 0,
    freight: 0,
    otherExpenses: 0,
    items: [buildBasePurchaseItem({ brand: '' })],
  })

  const withoutBrand = purchaseCreateSchema.safeParse({
    supplier: 'PADEIRO',
    paymentCondition: [],
    discounts: 0,
    freight: 0,
    otherExpenses: 0,
    items: [buildBasePurchaseItem({ brand: undefined })],
  })

  assert.equal(withEmptyBrand.success, true)
  assert.equal(withoutBrand.success, true)
})


test('purchaseCreateSchema não aceita data de compra enviada pelo cliente', () => {
  const result = purchaseCreateSchema.safeParse({
    supplier: 'PADEIRO',
    purchaseDate: '2099-01-01',
    paymentCondition: [],
    items: [buildBasePurchaseItem()],
  })

  assert.equal(result.success, false)
})
