import { connectToDatabase } from '@/server/db/mongodb'
import { CustomerService } from '@/server/services/customers/customers.service'
import { DeliveryService } from '@/server/services/deliveries/deliveries.service'
import { InventoryService } from '@/server/services/inventories/inventories.service'
import { PurchaseService } from '@/server/services/purchases/purchases.service'
import { SalesService } from '@/server/services/sales/sales.service'
import { SupplierService } from '@/server/services/suppliers/suppliers.service'
import type { DashboardSummary } from '@/types/dashboard'
import type { Sale } from '@/types/sale'

function normalizeSale(sale: Awaited<ReturnType<typeof SalesService.list>>[number]): Sale {
  return {
    ...sale,
    items: sale.items.map((item, index) => ({
      ...item,
      id: `${sale.id}-item-${index + 1}`,
      subtotal: item.subtotal ?? Number(((item.quantity * item.unitPrice) - (item.discount ?? 0)).toFixed(2)),
    })),
  }
}

export const DashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    await connectToDatabase()

    const [customers, sales, purchases, inventoryItems, deliveries, suppliers] = await Promise.all([
      CustomerService.list(),
      SalesService.list(),
      PurchaseService.list(),
      InventoryService.list(),
      DeliveryService.getAll(),
      SupplierService.list(),
    ])

    return {
      customers,
      sales: sales.map(normalizeSale),
      purchases,
      inventoryItems,
      deliveries,
      suppliers: suppliers.map((supplier) => supplier.name),
      generatedAt: new Date().toISOString(),
    }
  },
}
