import test from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateDeliveryStatusFromItems,
  completeDeliveryItems,
  markDeliveryItemsAsDelivered,
  markDeliveryItemsAsPending,
} from '@/lib/delivery-sync'
import { normalizeSalePayments } from '@/lib/sales'
import { recalculateDeliveryStatus, getDeliveryStatusAfterItemToggle } from '@/lib/deliveries'
import type { DeliveryItem } from '@/types/delivery'

type TestDeliveryItem = DeliveryItem & {
  deliveredAt?: string
}

const baseDelivery = {
  id: 'delivery-1',
  saleId: 'sale-1',
  saleNumber: 'VEN-1',
  customerId: 'customer-1',
  customerName: 'Cliente',
  customerPhone: '',
  address: {
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
  },
  scheduledDate: '2026-07-21T12:00:00.000Z',
  status: 'PENDING' as const,
  items: [
    {
      id: 'item-1',
      productId: 'p-1',
      productName: 'Produto 1',
      sku: 'SKU-1',
      quantity: 1,
      unit: 'UN',
      delivered: false,
      deliveredAt: undefined,
    },
    {
      id: 'item-2',
      productId: 'p-2',
      productName: 'Produto 2',
      sku: 'SKU-2',
      quantity: 2,
      unit: 'UN',
      delivered: false,
      deliveredAt: undefined,
    },
  ] as TestDeliveryItem[],
  createdAt: '2026-07-21T12:00:00.000Z',
  updatedAt: '2026-07-21T12:00:00.000Z',
}

test('calculateDeliveryStatusFromItems returns pending for empty or fully pending lists', () => {
  assert.equal(calculateDeliveryStatusFromItems([]), 'PENDING')
  assert.equal(
    calculateDeliveryStatusFromItems([
      { delivered: false },
      { delivered: false },
    ]),
    'PENDING'
  )
})

test('calculateDeliveryStatusFromItems returns partial and delivered correctly', () => {
  assert.equal(
    calculateDeliveryStatusFromItems([
      { delivered: true },
      { delivered: false },
    ]),
    'PARTIALLY_DELIVERED'
  )

  assert.equal(
    calculateDeliveryStatusFromItems([
      { delivered: true },
      { delivered: true },
    ]),
    'DELIVERED'
  )
})

test('markDeliveryItemsAsDelivered updates every item with the same timestamp', () => {
  const deliveredAt = '2026-07-21T15:30:00.000Z'
  const updated = markDeliveryItemsAsDelivered(baseDelivery.items, deliveredAt)

  assert.equal(updated.every((item) => item.delivered), true)
  assert.equal(updated.every((item) => item.deliveredAt === deliveredAt), true)
  assert.equal(updated[0].productName, 'Produto 1')
})

test('markDeliveryItemsAsPending clears delivery flags', () => {
  const delivered = markDeliveryItemsAsDelivered(baseDelivery.items, '2026-07-21T15:30:00.000Z')
  const pending = markDeliveryItemsAsPending(delivered)

  assert.equal(pending.every((item) => item.delivered === false), true)
  assert.equal(pending.every((item) => item.deliveredAt === undefined), true)
})

test('completeDeliveryItems marks all items delivered and preserves existing timestamps', () => {
  const deliveredAt = '2026-07-21T15:30:00.000Z'
  const updated = completeDeliveryItems(
    [
      { ...baseDelivery.items[0], delivered: true, deliveredAt: '2026-07-21T10:00:00.000Z' },
      { ...baseDelivery.items[1], delivered: false, deliveredAt: undefined },
    ],
    deliveredAt
  )

  assert.equal(updated.every((item) => item.delivered), true)
  assert.equal(updated[0].deliveredAt, '2026-07-21T10:00:00.000Z')
  assert.equal(updated[1].deliveredAt, deliveredAt)
})

test('delivery status helpers keep the sale status aligned with item state', () => {
  const pendingDelivery = { ...baseDelivery, items: baseDelivery.items.map((item) => ({ ...item, delivered: false })) }
  const partialDelivery = {
    ...baseDelivery,
    items: [
      { ...baseDelivery.items[0], delivered: true, deliveredAt: '2026-07-21T10:00:00.000Z' },
      { ...baseDelivery.items[1], delivered: false },
    ],
  }
  const completedDelivery = {
    ...baseDelivery,
    items: baseDelivery.items.map((item) => ({ ...item, delivered: true, deliveredAt: '2026-07-21T10:00:00.000Z' })),
    status: 'IN_ROUTE' as const,
  }

  assert.equal(recalculateDeliveryStatus(pendingDelivery), 'PENDING')
  assert.equal(getDeliveryStatusAfterItemToggle(partialDelivery), 'PARTIALLY_DELIVERED')
  assert.equal(recalculateDeliveryStatus(completedDelivery), 'DELIVERED')
})

test('normalizeSalePayments allows zero initial payment for fiado sales', () => {
  const payments = normalizeSalePayments([], {
    paymentCondition: { type: 'FIADO', installments: [] },
    paymentMethod: '',
    initialPayment: 0,
    saleDate: '2026-07-21T12:00:00.000Z',
    total: 100,
  })

  assert.equal(payments.length, 0)
})
