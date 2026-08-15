import { MOCK_CUSTOMERS } from '@/lib/mock/customers'
import { MOCK_INVENTORY_ITEMS } from '@/lib/mock/inventory'
import {
  SALE_PAYMENT_CONDITION_OPTIONS,
  SALE_PAYMENT_METHODS,
  calculateSaleItemSubtotal,
  calculateSaleSubtotal,
  calculateSaleDiscount,
  calculateSaleTotal,
  getSaleDeliveryStatus,
  roundCurrency,
} from '@/lib/sales'
import type { Sale, SaleHistoryEntry, SaleItem, SaleDeliveryStatus } from '@/types/sale'

const SALE_DELIVERY_STATUSES: SaleDeliveryStatus[] = ['PENDING', 'DELIVERED']
const MOCK_SELLERS = [
  { id: 'seller-1', name: 'João Silva' },
  { id: 'seller-2', name: 'Ana Souza' },
  { id: 'seller-3', name: 'Marcos Lima' },
  { id: 'seller-4', name: 'Patrícia Alves' },
]

function nowISO(offsetDays = 0, offsetHours = 0) {
  const date = new Date()
  date.setDate(date.getDate() - offsetDays)
  date.setHours(date.getHours() - offsetHours)
  return date.toISOString()
}

function createId(index: number) {
  return `sale-${String(index + 1).padStart(3, '0')}`
}

function pickProducts(index: number) {
  const available = MOCK_INVENTORY_ITEMS.filter((item) => item.availableStock > 0)
  const first = available[index % available.length]
  const second = available[(index + 7) % available.length]
  const third = available[(index + 13) % available.length]
  return index % 3 === 0 ? [first, second] : index % 4 === 0 ? [first, second, third] : [first, second]
}

function buildItem(productIndex: number, saleIndex: number): SaleItem {
  const product = pickProducts(saleIndex)[productIndex]
  const quantity = Math.max(1, Math.min(product.availableStock, ((saleIndex + productIndex) % 6) + 1))
  const unitPrice = roundCurrency(product.salePrice)
  const discount = saleIndex % 5 === 0 && productIndex === 0 ? roundCurrency(unitPrice * 0.05) : 0

  return {
    id: `sale-item-${saleIndex + 1}-${productIndex + 1}`,
    productId: product.productId,
    productName: product.productName,
    sku: product.sku,
    unit: product.unit,
    quantity,
    availableStock: product.availableStock,
    unitPrice,
    discount,
    subtotal: calculateSaleItemSubtotal(quantity, unitPrice, discount),
  }
}

function buildHistory(sale: Sale): SaleHistoryEntry[] {
  const created: SaleHistoryEntry = {
    id: `${sale.id}-history-1`,
    saleId: sale.id,
    action: 'created',
    description: 'Venda criada no sistema.',
    user: sale.sellerName,
    date: sale.createdAt,
  }

  const entries: SaleHistoryEntry[] = [created]

  if (sale.deliveryStatus === 'DELIVERED') {
    entries.push({
      id: `${sale.id}-history-2`,
      saleId: sale.id,
      action: 'delivered',
      description: 'Venda marcada como entregue.',
      user: sale.sellerName,
      date: nowISO(0, 6),
    })
  }

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function buildSale(index: number): Sale {
  const customer = MOCK_CUSTOMERS[index % MOCK_CUSTOMERS.length]
  const seller = MOCK_SELLERS[index % MOCK_SELLERS.length]
  const items = pickProducts(index).map((_, itemIndex) => buildItem(itemIndex, index))
  const subtotal = calculateSaleSubtotal(items)
  const discount = calculateSaleDiscount(items, index % 4 === 0 ? 25 : 0)
  const shipping = index % 3 === 0 ? 25 : index % 5 === 0 ? 15 : 0
  const otherCosts = index % 6 === 0 ? 10 : 0
  const total = calculateSaleTotal(subtotal, discount, shipping, otherCosts)
  const saleDate = nowISO(1 + index)
  const deliveryStatus = SALE_DELIVERY_STATUSES[index % SALE_DELIVERY_STATUSES.length]
  const isDelivery = deliveryStatus === 'PENDING'
  const paymentConditionType = SALE_PAYMENT_CONDITION_OPTIONS[index % SALE_PAYMENT_CONDITION_OPTIONS.length].value
  const paymentMethod = SALE_PAYMENT_METHODS[index % SALE_PAYMENT_METHODS.length]
  const paymentCondition =
    paymentConditionType === 'A_VISTA'
      ? {
          type: 'A_VISTA' as const,
          installments: [],
        }
      : {
          type: paymentConditionType,
          installments: [
            {
              id: `${createId(index)}-av-1`,
              number: 1,
              amount: roundCurrency(total / 2),
              paymentMethod,
              status: 'PENDENTE' as const,
            },
            {
              id: `${createId(index)}-av-2`,
              number: 2,
              amount: roundCurrency(total - roundCurrency(total / 2)),
              paymentMethod: SALE_PAYMENT_METHODS[(index + 1) % SALE_PAYMENT_METHODS.length],
              dueDate: nowISO(15),
              status: 'PENDENTE' as const,
            },
          ],
        }
  const payments =
    paymentConditionType === 'A_VISTA'
      ? [
          {
            id: `${createId(index)}-payment-1`,
            amount: total,
            date: saleDate,
            paymentMethod,
            notes: '',
          },
        ]
      : [
          {
            id: `${createId(index)}-payment-1`,
            amount: roundCurrency(total / 2),
            date: saleDate,
            paymentMethod,
            notes: 'Entrada',
          },
        ]
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingAmount = roundCurrency(Math.max(0, total - paidAmount))
  const paymentStatus = remainingAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING'

  return {
    id: createId(index),
    customerId: customer.id,
    customerName: customer.name,
    sellerId: seller.id,
    sellerName: seller.name,
    saleDate,
    isDelivery,
    deliveryStatus: getSaleDeliveryStatus(isDelivery),
    deliveryDate: isDelivery ? nowISO(index % 4) : undefined,
    paymentMethod: paymentConditionType === 'A_VISTA' ? paymentMethod : '',
    paymentCondition,
    payments,
    paymentStatus,
    paidAmount,
    remainingAmount,
    initialPayment: payments[0]?.amount ?? 0,
    notes: index % 4 === 0 ? 'Separar para entrega na obra.' : index % 5 === 0 ? 'Cliente solicitou nota fiscal no ato.' : '',
    subtotal,
    discount,
    shipping,
    otherCosts,
    total,
    items,
    createdAt: nowISO(2 + index),
    updatedAt: nowISO(index % 3),
  }
}

export const MOCK_SALES: Sale[] = Array.from({ length: 30 }).map((_, index) => buildSale(index))

export const MOCK_SALES_HISTORY: Record<string, SaleHistoryEntry[]> = Object.fromEntries(
  MOCK_SALES.map((sale) => [sale.id, buildHistory(sale)])
)

export type MockCustomerPurchaseRow = {
  customerId: string
  customerName: string
  saleId: string
  saleDate: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unit: string
  subtotal: number
}

export const MOCK_CUSTOMER_PURCHASE_ROWS: MockCustomerPurchaseRow[] = MOCK_SALES.flatMap((sale) =>
  sale.items.map((item) => ({
    customerId: sale.customerId,
    customerName: sale.customerName,
    saleId: sale.id,
    saleDate: sale.saleDate,
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unit: item.unit,
    subtotal: item.subtotal,
  }))
)
