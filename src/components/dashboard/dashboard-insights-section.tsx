"use client"

import type { DashboardInsightsSectionProps } from '@/types/dashboard'
import { DashboardLowStockItemsCard } from './dashboard-low-stock-items-card'
import { DashboardTopCustomersCard } from './dashboard-top-customers-card'

export function DashboardInsightsSection(props: DashboardInsightsSectionProps) {
  return (
    <section className="grid gap-4">
      <DashboardTopCustomersCard {...props} />
      <DashboardLowStockItemsCard {...props} />
    </section>
  )
}
