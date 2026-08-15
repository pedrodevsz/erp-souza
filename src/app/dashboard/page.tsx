import { DashboardPage as DashboardPageContent } from '@/components/dashboard/dashboard-page'
import { DashboardService } from '@/server/services/dashboard/dashboard.service'
import type { DashboardSummary } from '@/types/dashboard'

const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  customers: [],
  sales: [],
  purchases: [],
  inventoryItems: [],
  deliveries: [],
  suppliers: [],
  generatedAt: '',
}

export default async function DashboardPage() {
  let summary = EMPTY_DASHBOARD_SUMMARY
  let loadError: string | null = null

  try {
    summary = await DashboardService.getSummary()
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Erro ao carregar dashboard.'
  }

  return <DashboardPageContent initialSummary={summary} initialLoadError={loadError} />
}
