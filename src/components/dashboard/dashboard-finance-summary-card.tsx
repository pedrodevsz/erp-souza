"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui'
import { PageLoading } from '@/components/shared/page-loading'
import { EmptyStateAction } from '@/components/shared'
import { calculateFinanceSummaryByPeriod, formatDashboardCurrency } from '@/lib/dashboard'
import type { DashboardFinancePeriod, DashboardOverviewSectionProps } from '@/types/dashboard'

type Props = Pick<DashboardOverviewSectionProps, 'sales' | 'purchases' | 'loading' | 'error' | 'onRetry'>

const FINANCE_PERIOD_OPTIONS: Array<{ value: DashboardFinancePeriod; label: string }> = [
  { value: 'month', label: 'Este Mês' },
  { value: 'quarter', label: 'Últimos 3 Meses' },
  { value: 'year', label: 'Este Ano' },
]

export function DashboardFinanceSummaryCard({ sales, purchases, loading, error, onRetry }: Props) {
  const [period, setPeriod] = useState<DashboardFinancePeriod>('month')
  const summary = useMemo(() => calculateFinanceSummaryByPeriod(sales, purchases, period), [purchases, period, sales])
  const state = loading ? 'loading' : error ? 'error' : summary.receivable === 0 && summary.payable === 0 ? 'empty' : 'ready'

  if (loading) {
    return <PageLoading />
  }

  return (
    <Card className="h-full overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-sm font-semibold text-slate-900 sm:text-[15px]">Financeiro</CardTitle>

        <Select
          value={period}
          onChange={(event) => setPeriod(event.target.value as DashboardFinancePeriod)}
          className="h-8 w-full rounded-lg border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm outline-none sm:w-[120px]"
          aria-label="Filtrar financeiro"
        >
          {FINANCE_PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </CardHeader>

      <CardContent className="p-3.5">
        {state === 'error' ? (
          <EmptyStateAction
            title="Falha ao carregar financeiro"
            description={error ?? 'Tente novamente para atualizar os valores.'}
            actionLabel="Tentar novamente"
            onAction={onRetry}
            className="py-8"
          />
        ) : state === 'empty' ? (
          <EmptyStateAction title="Sem movimentações no período" description="Amplie o filtro para visualizar os valores." className="py-8" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-700">A Receber</p>
              <p className="text-sm font-semibold text-emerald-600">{formatDashboardCurrency(summary.receivable)}</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-700">A Pagar</p>
              <p className="text-sm font-semibold text-red-600">{formatDashboardCurrency(summary.payable)}</p>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-800">Saldo Previsto</p>
              <p className={`text-sm font-semibold ${summary.projectedBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatDashboardCurrency(summary.projectedBalance)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
