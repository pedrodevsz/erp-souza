import assert from 'node:assert/strict'
import test from 'node:test'

import { buildReceivedRevenueSeries, calculateReceivedRevenueByPeriod } from './dashboard'
import type { Sale } from '@/types/sale'

const baseSale: Sale = {
  id: 'sale-base',
  customerId: 'customer-1',
  customerName: 'Cliente Teste',
  sellerId: 'seller-1',
  sellerName: 'Vendedor Teste',
  saleDate: '2026-08-01T10:00:00.000Z',
  isDelivery: false,
  deliveryStatus: 'DELIVERED',
  paymentMethod: '',
  paymentCondition: {
    type: 'A_VISTA',
    installments: [],
  },
  payments: [],
  paymentStatus: 'PENDING',
  paidAmount: 0,
  remainingAmount: 0,
  subtotal: 0,
  discount: 0,
  shipping: 0,
  otherCosts: 0,
  total: 0,
  items: [],
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
}

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    ...baseSale,
    ...overrides,
    paymentCondition: {
      ...baseSale.paymentCondition,
      ...(overrides.paymentCondition ?? {}),
      installments: overrides.paymentCondition?.installments ?? baseSale.paymentCondition.installments,
    },
    payments: overrides.payments ?? baseSale.payments,
    items: overrides.items ?? baseSale.items,
  }
}

test('calcula faturamento pelo valor efetivamente recebido em uma venda parcialmente paga', () => {
  const sale = makeSale({
    id: 'sale-partial',
    total: 224,
    paidAmount: 24,
    remainingAmount: 200,
    paymentStatus: 'PARTIAL',
    payments: [
      {
        id: 'payment-1',
        amount: 24,
        date: '2026-08-10T12:00:00.000Z',
        paymentMethod: 'Pix',
        notes: '',
      },
    ],
  })

  assert.equal(calculateReceivedRevenueByPeriod([sale], 'month', new Date('2026-08-31T23:59:59.000Z')), 24)
})

test('retorna zero quando não existe pagamento registrado', () => {
  const sale = makeSale({
    id: 'sale-empty',
    total: 224,
    paymentStatus: 'PENDING',
    paidAmount: 0,
    remainingAmount: 224,
  })

  assert.equal(calculateReceivedRevenueByPeriod([sale], 'month', new Date('2026-08-31T23:59:59.000Z')), 0)
})

test('soma vários pagamentos da mesma venda sem usar o total bruto', () => {
  const sale = makeSale({
    id: 'sale-multiple-payments',
    total: 224,
    paidAmount: 74,
    remainingAmount: 150,
    paymentStatus: 'PARTIAL',
    payments: [
      {
        id: 'payment-1',
        amount: 24,
        date: '2026-08-05T12:00:00.000Z',
        paymentMethod: 'Pix',
        notes: '',
      },
      {
        id: 'payment-2',
        amount: 50,
        date: '2026-08-15T12:00:00.000Z',
        paymentMethod: 'Dinheiro',
        notes: '',
      },
    ],
  })

  assert.equal(calculateReceivedRevenueByPeriod([sale], 'month', new Date('2026-08-31T23:59:59.000Z')), 74)
})

test('soma vendas diferentes sem duplicar o total da venda', () => {
  const saleA = makeSale({
    id: 'sale-a',
    total: 224,
    paidAmount: 24,
    remainingAmount: 200,
    paymentStatus: 'PARTIAL',
    payments: [
      {
        id: 'payment-a1',
        amount: 24,
        date: '2026-08-10T12:00:00.000Z',
        paymentMethod: 'Pix',
        notes: '',
      },
    ],
  })

  const saleB = makeSale({
    id: 'sale-b',
    total: 100,
    paidAmount: 100,
    remainingAmount: 0,
    paymentStatus: 'PAID',
    payments: [
      {
        id: 'payment-b1',
        amount: 100,
        date: '2026-08-12T12:00:00.000Z',
        paymentMethod: 'Cartão',
        notes: '',
      },
    ],
  })

  assert.equal(calculateReceivedRevenueByPeriod([saleA, saleB], 'month', new Date('2026-08-31T23:59:59.000Z')), 124)
})

test('atribui a receita ao mês do pagamento e não ao mês da venda', () => {
  const sale = makeSale({
    id: 'sale-cross-month',
    saleDate: '2026-07-31T18:00:00.000Z',
    total: 1000,
    paidAmount: 50,
    remainingAmount: 950,
    paymentStatus: 'PARTIAL',
    payments: [
      {
        id: 'payment-cross-1',
        amount: 50,
        date: '2026-08-05T12:00:00.000Z',
        paymentMethod: 'Pix',
        notes: '',
      },
    ],
  })

  assert.equal(calculateReceivedRevenueByPeriod([sale], 'month', new Date('2026-07-31T23:59:59.000Z')), 0)
  assert.equal(calculateReceivedRevenueByPeriod([sale], 'month', new Date('2026-08-31T23:59:59.000Z')), 50)
})

test('gera série mensal com pagamentos separados por mês de recebimento', () => {
  const sale = makeSale({
    id: 'sale-series',
    saleDate: '2026-07-20T10:00:00.000Z',
    total: 1000,
    paidAmount: 1000,
    remainingAmount: 0,
    paymentStatus: 'PAID',
    payments: [
      {
        id: 'payment-series-1',
        amount: 200,
        date: '2026-08-10T12:00:00.000Z',
        paymentMethod: 'Pix',
        notes: '',
      },
      {
        id: 'payment-series-2',
        amount: 300,
        date: '2026-08-25T12:00:00.000Z',
        paymentMethod: 'Pix',
        notes: '',
      },
      {
        id: 'payment-series-3',
        amount: 500,
        date: '2026-09-05T12:00:00.000Z',
        paymentMethod: 'Pix',
        notes: '',
      },
    ],
  })

  const series = buildReceivedRevenueSeries([sale], 3, new Date('2026-09-30T23:59:59.000Z'))

  assert.deepEqual(
    series.map((point) => point.value),
    [0, 500, 500]
  )
})
