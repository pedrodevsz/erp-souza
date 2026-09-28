import assert from 'node:assert/strict'
import test from 'node:test'
import { recalculateDeliveryStatus, getDeliveryStatusAfterItemToggle } from './deliveries'
import { deliveryUpdateSchema } from '@/server/schemas/deliveries/deliveries.schema'
import type { Delivery } from '@/types/delivery'

const delivery = (status: Delivery['status'], delivered: boolean[]): Delivery => ({
  id: 'delivery-1', saleId: 'sale-1', saleNumber: 'VEN-1', customerId: 'customer-1', customerName: 'Cliente', customerPhone: '',
  address: { street: '', number: '', district: '' }, scheduledDate: '2026-09-23T12:00:00.000Z', status,
  items: delivered.map((isDelivered, index) => ({ id: String(index), productId: String(index), productName: 'Produto', sku: String(index), quantity: 1, unit: 'UN', delivered: isDelivered })),
  createdAt: '2026-09-23T12:00:00.000Z', updatedAt: '2026-09-23T12:00:00.000Z',
})

test('fluxo novo vai de pendente para parcialmente entregue sem IN_ROUTE', () => {
  assert.equal(getDeliveryStatusAfterItemToggle(delivery('PENDING', [true, false])), 'PARTIALLY_DELIVERED')
})

test('fluxo novo vai de pendente para entregue quando todos os itens são entregues', () => {
  assert.equal(recalculateDeliveryStatus(delivery('PENDING', [true, true])), 'DELIVERED')
})

test('entrega legacy IN_ROUTE pode avançar para parcial ou entregue', () => {
  assert.equal(recalculateDeliveryStatus(delivery('IN_ROUTE', [true, false])), 'PARTIALLY_DELIVERED')
  assert.equal(recalculateDeliveryStatus(delivery('IN_ROUTE', [true, true])), 'DELIVERED')
})

test('atualização não aceita criar nova transição IN_ROUTE', () => {
  assert.equal(deliveryUpdateSchema.safeParse({ status: 'IN_ROUTE' }).success, false)
})
