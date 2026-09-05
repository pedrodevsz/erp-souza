"use client"

import type { DashboardOverviewSectionProps } from '@/types/dashboard'
import { DashboardDeliveriesSummaryCard } from './dashboard-deliveries-summary-card'
import { DashboardFinanceSummaryCard } from './dashboard-finance-summary-card'
import { DashboardSalesChartCard } from './dashboard-sales-chart-card'
import { DashboardStockSummaryCard } from './dashboard-stock-summary-card'

export function DashboardOverviewSection(props: DashboardOverviewSectionProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2">
      <div className="h-full">
        <DashboardStockSummaryCard inventoryItems={props.inventoryItems} loading={props.loading} error={props.error} onRetry={props.onRetry} />
      </div>
      <div className="h-full">
        <DashboardSalesChartCard sales={props.sales} loading={props.loading} error={props.error} onRetry={props.onRetry} />
      </div>
      <div className="h-full">
        <DashboardFinanceSummaryCard sales={props.sales} purchases={props.purchases} loading={props.loading} error={props.error} onRetry={props.onRetry} />
      </div>
      <div className="h-full">
        <DashboardDeliveriesSummaryCard deliveries={props.deliveries} loading={props.loading} error={props.error} onRetry={props.onRetry} />
      </div>
    </section>
  )
}
