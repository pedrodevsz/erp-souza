"use client"

import { useMemo, useState } from 'react'
import { DollarSign, ReceiptText, ShoppingCart, Truck, Warehouse } from 'lucide-react'
import { CustomerCreateDialog } from '@/components/customers/add/customer-create-dialog'
import { NewSupplierModal } from '@/components/suppliers/new-supplier-modal'
import { EmployeeManagementDialog } from '@/components/settings/employee-management-section'
import { DashboardService } from '@/services/dashboardService'
import { useSupplierStore } from '@/stores/useSupplierStore'
import {
  buildMonthlySeries,
  buildReceivedRevenueSeries,
  calculateGrossProfit,
  calculateReceivedRevenueByPeriod,
  formatDashboardCurrency,
  formatDashboardNumber,
  getCurrentMonthPurchaseTotal,
  getCurrentMonthSalesCount,
  getPendingOrdersCount,
} from '@/lib/dashboard'
import type { DashboardSummary } from '@/types/dashboard'
import { DashboardQuickActionsSection } from './dashboard-action-cards'
import { DashboardInsightsSection } from './dashboard-insights-section'
import { DashboardOverviewSection } from './dashboard-overview-section'
import { MetricCard } from './dashboard-metric-cards'
import type { MetricState } from './dashboard.types'
import { PageLoading } from '@/components/shared/page-loading'

const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  customers: [],
  sales: [],
  purchases: [],
  inventoryItems: [],
  deliveries: [],
  suppliers: [],
  generatedAt: '',
}

type Props = {
  initialSummary: DashboardSummary
  initialLoadError?: string | null
}

const dashboardDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

function formatDashboardHeadingDate(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? dashboardDateFormatter.format(new Date()) : dashboardDateFormatter.format(parsed)
}

export function DashboardContent({ initialSummary, initialLoadError = null }: Props) {
  const [summary, setSummary] = useState<DashboardSummary>(initialSummary)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(initialLoadError)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [employeesDialogOpen, setEmployeesDialogOpen] = useState(false)
  const createSupplier = useSupplierStore((state) => state.createSupplier)

  async function loadSummary() {
    try {
      setLoading(true)
      const data = await DashboardService.getSummary()
      setSummary(data)
      setLoadError(null)
    } catch (error) {
      setSummary(EMPTY_DASHBOARD_SUMMARY)
      setLoadError(error instanceof Error ? error.message : 'Erro ao carregar dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const sales = summary.sales
  const purchases = summary.purchases
  const inventoryItems = summary.inventoryItems
  const deliveries = summary.deliveries

  const currentMonthRevenue = useMemo(() => calculateReceivedRevenueByPeriod(sales), [sales])
  const currentMonthSalesCount = useMemo(() => getCurrentMonthSalesCount(sales), [sales])
  const currentMonthPurchasesTotal = useMemo(() => getCurrentMonthPurchaseTotal(purchases), [purchases])
  const currentMonthGrossProfit = useMemo(() => calculateGrossProfit(sales, inventoryItems), [inventoryItems, sales])
  const pendingOrders = useMemo(() => getPendingOrdersCount(deliveries), [deliveries])
  const revenueSeries = useMemo(() => buildReceivedRevenueSeries(sales, 6), [sales])
  const salesCountSeries = useMemo(() => buildMonthlySeries(sales, 6, (sale) => sale.saleDate, () => 1), [sales])
  const purchasesSeries = useMemo(() => buildMonthlySeries(purchases, 6, (purchase) => purchase.purchaseDate, (purchase) => purchase.total), [purchases])
  const grossProfitSeries = useMemo(
    () =>
      revenueSeries.map((point, index) => ({
        label: point.label,
        value: point.value - (purchasesSeries[index]?.value ?? 0),
      })),
    [purchasesSeries, revenueSeries]
  )
  const pendingSeries = useMemo(
    () => buildMonthlySeries(sales, 6, (sale) => sale.saleDate, (sale) => (sale.deliveryStatus === 'PENDING' ? 1 : 0)),
    [sales]
  )

  const revenueState: MetricState = loading ? 'loading' : loadError ? 'error' : currentMonthRevenue === 0 ? 'empty' : 'ready'
  const salesState: MetricState = loading ? 'loading' : loadError ? 'error' : currentMonthSalesCount === 0 ? 'empty' : 'ready'
  const purchasesState: MetricState = loading ? 'loading' : loadError ? 'error' : currentMonthPurchasesTotal === 0 ? 'empty' : 'ready'
  const deliveriesState: MetricState = loading ? 'loading' : loadError ? 'error' : pendingOrders === 0 ? 'empty' : 'ready'
  const grossProfitState: MetricState = loading ? 'loading' : loadError ? 'error' : currentMonthSalesCount === 0 ? 'empty' : 'ready'

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-sky-600">Resumo de hoje</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-slate-500">Visão geral completa do seu negócio.</p>
          <p className="text-xs text-slate-400">{formatDashboardHeadingDate(summary.generatedAt)}</p>
        </div>
      </section>

      <DashboardQuickActionsSection
        onOpenCustomer={() => setCustomerDialogOpen(true)}
        onOpenSupplier={() => setSupplierDialogOpen(true)}
        onOpenEmployeeManager={() => setEmployeesDialogOpen(true)}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Faturamento do Mês"
          description="Receita efetivamente recebida no mês atual."
          value={formatDashboardCurrency(currentMonthRevenue)}
          tone="blue"
          icon={<ReceiptText className="h-4 w-4" />}
          state={revenueState}
          emptyDescription="Sem recebimentos neste mês."
          series={revenueSeries.map((point) => point.value)}
          onRetry={() => void loadSummary()}
        />
        <MetricCard
          title="Vendas do Mês"
          description="Quantidade de vendas concluídas no mês atual."
          value={formatDashboardNumber(currentMonthSalesCount)}
          tone="green"
          icon={<ShoppingCart className="h-4 w-4" />}
          state={salesState}
          emptyDescription="Sem vendas neste mês."
          series={salesCountSeries.map((point) => point.value)}
          onRetry={() => void loadSummary()}
        />
        <MetricCard
          title="Compras do Mês"
          description="Total de compras registradas no mês atual."
          value={formatDashboardCurrency(currentMonthPurchasesTotal)}
          tone="orange"
          icon={<Warehouse className="h-4 w-4" />}
          state={purchasesState}
          emptyDescription="Sem compras neste mês."
          series={purchasesSeries.map((point) => point.value)}
          onRetry={() => void loadSummary()}
        />
        <MetricCard
          title="Lucro Bruto do Mês"
          description="Vendas menos o custo dos produtos vendidos."
          value={formatDashboardCurrency(currentMonthGrossProfit)}
          tone="purple"
          icon={<DollarSign className="h-4 w-4" />}
          state={grossProfitState}
          emptyDescription="Sem lucro calculado neste mês."
          series={grossProfitSeries.map((point) => point.value)}
          onRetry={() => void loadSummary()}
        />
        <MetricCard
          title="Pedidos Pendentes"
          description="Vendas ou entregas ainda aguardando conclusão."
          value={formatDashboardNumber(pendingOrders)}
          tone="red"
          icon={<Truck className="h-4 w-4" />}
          state={deliveriesState}
          emptyDescription="Sem pedidos pendentes."
          series={pendingSeries.map((point) => point.value)}
          onRetry={() => void loadSummary()}
        />
      </section>

      <DashboardInsightsSection
        customers={summary.customers}
        sales={sales}
        inventoryItems={inventoryItems}
        loading={loading}
        error={loadError}
        onRetry={() => void loadSummary()}
      />

      <DashboardOverviewSection
        sales={sales}
        purchases={purchases}
        deliveries={deliveries}
        inventoryItems={inventoryItems}
        loading={loading}
        error={loadError}
        onRetry={() => void loadSummary()}
      />

      {loadError && !loading && (
        <p className="text-sm text-red-600">As seções abaixo estão em modo de erro até a próxima tentativa de carregamento.</p>
      )}

      <CustomerCreateDialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen} />
      <NewSupplierModal
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        onCreate={async (name: string) => {
          return createSupplier(name)
        }}
      />
      <EmployeeManagementDialog open={employeesDialogOpen} onOpenChange={setEmployeesDialogOpen} />
    </div>
  )
}
