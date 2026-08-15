import type { Customer } from '@/types/customer'
import type { Delivery } from '@/types/delivery'
import type { InventoryItem } from '@/types/inventory'
import type { Purchase } from '@/types/purchases'
import type { Sale, SalePayment } from '@/types/sale'
import { roundCurrency } from '@/lib/sales'
import type {
  DashboardCustomerPeriod,
  DashboardDeliveryPeriod,
  DashboardFinancePeriod,
  DashboardLowStockRow,
  DashboardTopCustomerRow,
} from '@/types/dashboard'

export type DashboardMonthlyPoint = {
  label: string
  value: number
}

export type DashboardBreakdownItem = {
  label: string
  value: number
  color: string
}

export type DashboardFinanceSummary = {
  receivable: number
  payable: number
  projectedBalance: number
}

export type DashboardDeliverySummary = {
  scheduled: number
  inRoute: number
  delivered: number
  late: number
}

type ReceivedPayment = Pick<SalePayment, 'amount' | 'date'>

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const numberFormatter = new Intl.NumberFormat('pt-BR')

function parseDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? null : date
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function isSameMonth(left: string | Date, right: Date) {
  const leftDate = parseDate(left)
  if (!leftDate) return false
  return leftDate.getFullYear() === right.getFullYear() && leftDate.getMonth() === right.getMonth()
}

function isSameDay(left: string | Date, right: Date) {
  const leftDate = parseDate(left)
  if (!leftDate) return false
  return leftDate.getFullYear() === right.getFullYear() && leftDate.getMonth() === right.getMonth() && leftDate.getDate() === right.getDate()
}

function monthDistanceStart(date: Date, monthsBack: number) {
  return new Date(date.getFullYear(), date.getMonth() - monthsBack, 1)
}

function getPeriodStart(period: DashboardFinancePeriod | DashboardDeliveryPeriod, now: Date) {
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week': {
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - start.getDay())
      return start
    }
    case 'month':
      return getMonthStart(now)
    case 'quarter':
      return monthDistanceStart(now, 2)
    case 'year':
      return new Date(now.getFullYear(), 0, 1)
  }
}

function getPeriodEnd(period: DashboardFinancePeriod | DashboardDeliveryPeriod, now: Date) {
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    case 'week': {
      const start = getPeriodStart(period, now)
      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1)
    case 'quarter':
      return monthDistanceStart(now, 3)
    case 'year':
      return new Date(now.getFullYear() + 1, 0, 1)
  }
}

function isWithinPeriod(dateValue: string, period: DashboardFinancePeriod | DashboardDeliveryPeriod, now: Date) {
  const parsed = parseDate(dateValue)
  if (!parsed) return false
  return parsed >= getPeriodStart(period, now) && parsed < getPeriodEnd(period, now)
}

function getCustomerPeriodStart(period: DashboardCustomerPeriod, now: Date) {
  switch (period) {
    case 'month':
      return getMonthStart(now)
    case 'quarter':
      return monthDistanceStart(now, 2)
    case 'semester':
      return monthDistanceStart(now, 5)
    case 'year':
      return new Date(now.getFullYear(), 0, 1)
  }
}

function inCustomerPeriod(date: string, period: DashboardCustomerPeriod, now: Date) {
  const parsed = parseDate(date)
  if (!parsed) return false

  return parsed >= getCustomerPeriodStart(period, now)
}

export function formatDashboardCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0)
}

export function formatDashboardNumber(value: number) {
  return numberFormatter.format(Math.trunc(Number.isFinite(value) ? value : 0))
}

export function formatDashboardDate(value: string) {
  if (!value) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

export function getPreviousMonths(count: number, now: Date = new Date()) {
  const months: Date[] = []
  const current = getMonthStart(now)

  for (let index = count - 1; index >= 0; index -= 1) {
    months.push(new Date(current.getFullYear(), current.getMonth() - index, 1))
  }

  return months
}

export function buildMonthlySeries<T>(
  items: T[],
  count: number,
  getDate: (item: T) => string,
  getValue: (item: T) => number,
  now: Date = new Date()
): DashboardMonthlyPoint[] {
  const months = getPreviousMonths(count, now)

  return months.map((month) => {
    const total = items
      .filter((item) => isSameMonth(getDate(item), month))
      .reduce((sum, item) => sum + getValue(item), 0)

    return {
      label: month.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      value: total,
    }
  })
}

export function buildMonthlyCountSeries<T>(
  items: T[],
  count: number,
  getDate: (item: T) => string,
  predicate: (item: T) => boolean,
  now: Date = new Date()
) {
  return buildMonthlySeries(
    items.filter(predicate),
    count,
    getDate,
    () => 1,
    now
  )
}

export function buildDailyCountSeries<T>(
  items: T[],
  count: number,
  getDate: (item: T) => string,
  predicate: (item: T) => boolean,
  now: Date = new Date()
) {
  const days: Date[] = []
  const current = new Date(now)
  current.setHours(0, 0, 0, 0)

  for (let index = count - 1; index >= 0; index -= 1) {
    const day = new Date(current)
    day.setDate(current.getDate() - index)
    days.push(day)
  }

  return days.map((day) => {
    const total = items.filter((item) => predicate(item) && isSameDay(getDate(item), day)).length

    return {
      label: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: total,
    }
  })
}

export function aggregateTopCustomers(
  sales: Sale[],
  customers: Customer[],
  period: DashboardCustomerPeriod = 'month',
  now: Date = new Date()
) {
  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]))
  const grouped = new Map<string, DashboardTopCustomerRow>()

  sales
    .filter((sale) => inCustomerPeriod(sale.saleDate, period, now))
    .forEach((sale) => {
      const key = sale.customerId || sale.customerName.trim() || sale.id
      const current = grouped.get(key)
      const totalPurchased = (current?.totalPurchased ?? 0) + sale.total
      const orders = (current?.orders ?? 0) + 1
      const lastPurchaseDate =
        !current || new Date(sale.saleDate).getTime() > new Date(current.lastPurchaseDate).getTime()
          ? sale.saleDate
          : current.lastPurchaseDate

      grouped.set(key, {
        id: key,
        name: customerNames.get(sale.customerId) ?? sale.customerName,
        totalPurchased,
        orders,
        lastPurchaseDate,
      })
    })

  return Array.from(grouped.values()).sort((left, right) => {
    if (right.totalPurchased !== left.totalPurchased) {
      return right.totalPurchased - left.totalPurchased
    }

    return new Date(right.lastPurchaseDate).getTime() - new Date(left.lastPurchaseDate).getTime()
  })
}

export function aggregateLowStockItems(items: InventoryItem[], location = 'all'): DashboardLowStockRow[] {
  return items
    .filter((item) => (location === 'all' ? true : item.location === location))
    .filter((item) => item.currentStock === 0 || item.currentStock <= 5 || item.currentStock <= item.minimumStock)
    .sort((left, right) => {
      const leftPriority = left.currentStock === 0 ? 0 : 1
      const rightPriority = right.currentStock === 0 ? 0 : 1
      if (leftPriority !== rightPriority) return leftPriority - rightPriority
      if (left.currentStock !== right.currentStock) return left.currentStock - right.currentStock
      return left.productName.localeCompare(right.productName, 'pt-BR')
    })
    .map<DashboardLowStockRow>((item) => ({
      id: item.id,
      productName: item.productName,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      unit: item.unit,
      location: item.location,
      status: item.currentStock === 0 ? 'Falta' : 'Baixo',
    }))
}

export function getLowStockLocations(items: InventoryItem[]) {
  return Array.from(
    new Set(
      items
        .map((item) => item.location.trim())
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right, 'pt-BR'))
    )
  )
}

export function calculateInventoryBreakdown(items: InventoryItem[]): DashboardBreakdownItem[] {
  const inStock = items.filter((item) => item.currentStock > item.minimumStock && item.reservedStock === 0).length
  const lowStock = items.filter((item) => item.currentStock > 0 && item.currentStock <= item.minimumStock).length
  const empty = items.filter((item) => item.currentStock === 0).length
  const others = Math.max(0, items.length - inStock - lowStock - empty)

  return [
    { label: 'Produtos em Estoque', value: inStock, color: '#22c55e' },
    { label: 'Estoque Baixo', value: lowStock, color: '#f59e0b' },
    { label: 'Sem Estoque', value: empty, color: '#ef4444' },
    { label: 'Outros', value: others, color: '#94a3b8' },
  ].map((entry) => ({
    ...entry,
    value: Number.isFinite(entry.value) ? entry.value : 0,
  }))
}

export function calculateInventorySummary(items: InventoryItem[]) {
  const inStock = items.filter((item) => item.currentStock > item.minimumStock && item.reservedStock === 0).length
  const lowStock = items.filter((item) => item.currentStock > 0 && item.currentStock <= item.minimumStock).length
  const emptyStock = items.filter((item) => item.currentStock === 0).length
  const others = Math.max(0, items.length - inStock - lowStock - emptyStock)

  return {
    totalItems: items.length,
    inStock,
    lowStock,
    emptyStock,
    others,
  }
}

export function calculateFinanceSummary(sales: Sale[], purchases: Purchase[], deliveries: Delivery[], now: Date = new Date()): DashboardFinanceSummary {
  const payable = purchases.filter((purchase) => isSameMonth(purchase.purchaseDate, now)).reduce((sum, purchase) => sum + purchase.total, 0)
  const receivable = sales
    .reduce((sum, sale) => sum + (sale.remainingAmount ?? Math.max(0, sale.total - sale.paidAmount)), 0)

  void deliveries
  const projectedBalance = receivable - payable

  return {
    receivable,
    payable,
    projectedBalance,
  }
}

function isPurchaseReceivable(purchase: Purchase) {
  const paymentMethod = (purchase.paymentMethod ?? '').trim().toLowerCase()
  if (paymentMethod === 'boleto') {
    return true
  }

  return purchase.paymentCondition.some((condition) => condition.trim().toLowerCase() !== 'à vista')
}

export function calculateFinanceSummaryByPeriod(
  sales: Sale[],
  purchases: Purchase[],
  period: DashboardFinancePeriod = 'month',
  now: Date = new Date()
): DashboardFinanceSummary {
  const receivable = sales
    .filter((sale) => isWithinPeriod(sale.saleDate, period, now))
    .reduce((sum, sale) => sum + (sale.remainingAmount ?? Math.max(0, sale.total - sale.paidAmount)), 0)

  const payable = purchases
    .filter((purchase) => isWithinPeriod(purchase.purchaseDate, period, now))
    .filter((purchase) => isPurchaseReceivable(purchase))
    .reduce((sum, purchase) => sum + purchase.total, 0)

  return {
    receivable,
    payable,
    projectedBalance: receivable - payable,
  }
}

function collectReceivedPayments(sales: Sale[]): ReceivedPayment[] {
  return sales.flatMap((sale) =>
    sale.payments.map((payment) => ({
      amount: payment.amount,
      date: payment.date,
    }))
  )
}

export function calculateReceivedRevenueByPeriod(sales: Sale[], period: DashboardFinancePeriod = 'month', now: Date = new Date()) {
  return roundCurrency(
    collectReceivedPayments(sales)
      .filter((payment) => isWithinPeriod(payment.date, period, now))
      .reduce((sum, payment) => sum + payment.amount, 0)
  )
}

export function buildReceivedRevenueSeries(sales: Sale[], count: number, now: Date = new Date()) {
  return buildMonthlySeries(collectReceivedPayments(sales), count, (payment) => payment.date, (payment) => payment.amount, now)
}

export function calculateDeliverySummary(deliveries: Delivery[]): DashboardDeliverySummary {
  return {
    scheduled: deliveries.filter((delivery) => delivery.status === 'PENDING').length,
    inRoute: deliveries.filter((delivery) => delivery.status === 'IN_ROUTE').length,
    delivered: deliveries.filter((delivery) => delivery.status === 'DELIVERED').length,
    late: deliveries.filter((delivery) => delivery.status === 'LATE').length,
  }
}

export function calculateDeliverySummaryByPeriod(
  deliveries: Delivery[],
  period: DashboardDeliveryPeriod = 'month',
  now: Date = new Date()
): DashboardDeliverySummary {
  const filteredDeliveries = deliveries.filter((delivery) => isWithinPeriod(delivery.scheduledDate, period, now))

  return {
    scheduled: filteredDeliveries.filter((delivery) => delivery.status === 'PENDING').length,
    inRoute: filteredDeliveries.filter((delivery) => delivery.status === 'IN_ROUTE').length,
    delivered: filteredDeliveries.filter((delivery) => delivery.status === 'DELIVERED').length,
    late: filteredDeliveries.filter((delivery) => delivery.status === 'LATE').length,
  }
}

export function getCurrentMonthSalesTotal(sales: Sale[], now: Date = new Date()) {
  return sales.filter((sale) => isSameMonth(sale.saleDate, now)).reduce((sum, sale) => sum + sale.total, 0)
}

export function getCurrentMonthSalesCount(sales: Sale[], now: Date = new Date()) {
  return sales.filter((sale) => isSameMonth(sale.saleDate, now)).length
}

export function calculateGrossProfit(sales: Sale[], inventoryItems: InventoryItem[], now: Date = new Date()) {
  const costByKey = new Map<string, number>()

  inventoryItems.forEach((item) => {
    const normalizedCost = Number.isFinite(item.costPrice) ? item.costPrice : 0
    costByKey.set(item.productId.trim(), normalizedCost)
    costByKey.set(item.id, normalizedCost)
    if (item.sku?.trim()) {
      costByKey.set(item.sku.trim(), normalizedCost)
    }
  })

  const currentMonthSales = sales.filter((sale) => isSameMonth(sale.saleDate, now))

  const grossProfit = currentMonthSales.reduce((saleTotal, sale) => {
    const saleGross = sale.items.reduce((itemTotal, item) => {
      const fallbackCost = Number.isFinite(item.unitPrice) ? item.unitPrice : 0
      const matchedCost =
        costByKey.get(item.productId.trim()) ??
        costByKey.get(item.sku.trim()) ??
        costByKey.get(item.id.trim()) ??
        fallbackCost
      return itemTotal + item.subtotal - matchedCost * item.quantity
    }, 0)

    return saleTotal + saleGross
  }, 0)

  return roundCurrency(grossProfit)
}

export function getTodaySalesCount(sales: Sale[], now: Date = new Date()) {
  return sales.filter((sale) => isSameDay(sale.saleDate, now)).length
}

export function getCurrentMonthPurchaseTotal(purchases: Purchase[], now: Date = new Date()) {
  return purchases.filter((purchase) => isSameMonth(purchase.purchaseDate, now)).reduce((sum, purchase) => sum + purchase.total, 0)
}

function getPurchasePaymentDueDays(purchase: Purchase) {
  const numericConditions = purchase.paymentCondition
    .map((condition) => Number.parseInt(condition, 10))
    .filter((value) => Number.isFinite(value) && value > 0)

  return numericConditions.length > 0 ? Math.max(...numericConditions) : 30
}

export function getOverdueBoletoCount(purchases: Purchase[], now: Date = new Date()) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  return purchases.filter((purchase) => {
    if ((purchase.paymentMethod ?? '').trim().toLowerCase() !== 'boleto') {
      return false
    }

    const dueDate = new Date(purchase.purchaseDate)
    if (Number.isNaN(dueDate.getTime())) {
      return false
    }

    dueDate.setHours(0, 0, 0, 0)
    dueDate.setDate(dueDate.getDate() + getPurchasePaymentDueDays(purchase))

    return dueDate < today
  }).length
}

export function getPendingOrdersCount(deliveries: Delivery[]) {
  return deliveries.filter((delivery) => delivery.status === 'PENDING').length
}

export function buildSparklineSeries<T>(
  items: T[],
  count: number,
  getDate: (item: T) => string,
  getValue: (item: T) => number,
  now: Date = new Date()
) {
  return buildMonthlySeries(items, count, getDate, getValue, now).map((point) => point.value)
}
