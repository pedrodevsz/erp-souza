import type { Customer } from '@/types/customer'
import type { Delivery } from '@/types/delivery'
import type { InventoryItem } from '@/types/inventory'
import type { Purchase } from '@/types/purchases'
import type { Sale } from '@/types/sale'

export type DashboardCustomerPeriod = 'month' | 'quarter' | 'semester' | 'year'
export type DashboardFinancePeriod = 'month' | 'quarter' | 'year'
export type DashboardDeliveryPeriod = 'today' | 'week' | 'month'

export type DashboardTopCustomerRow = {
  id: string
  name: string
  totalPurchased: number
  orders: number
  lastPurchaseDate: string
}

export type DashboardLowStockRow = {
  id: string
  productName: string
  currentStock: number
  minimumStock: number
  unit: string
  location: string
  status: 'Falta' | 'Baixo'
}

export type DashboardInventorySummary = {
  totalItems: number
  inStock: number
  lowStock: number
  emptyStock: number
  others: number
}

export type DashboardInsightsSectionProps = {
  customers: Customer[]
  sales: Sale[]
  inventoryItems: InventoryItem[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export type DashboardOverviewSectionProps = {
  sales: Sale[]
  purchases: Purchase[]
  deliveries: Delivery[]
  inventoryItems: InventoryItem[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export type DashboardSummary = {
  customers: Customer[]
  sales: Sale[]
  purchases: Purchase[]
  inventoryItems: InventoryItem[]
  deliveries: Delivery[]
  suppliers: string[]
  generatedAt: string
}
