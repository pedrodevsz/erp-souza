"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui'
import { PageLoading } from '@/components/shared/page-loading'
import { EmptyStateAction } from '@/components/shared'
import { calculateDeliverySummaryByPeriod } from '@/lib/dashboard'
import type { DashboardDeliveryPeriod, DashboardOverviewSectionProps } from '@/types/dashboard'

type Props = Pick<DashboardOverviewSectionProps, 'deliveries' | 'loading' | 'error' | 'onRetry'>

const DELIVERY_PERIOD_OPTIONS: Array<{ value: DashboardDeliveryPeriod; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mês' },
]

export function DashboardDeliveriesSummaryCard({ deliveries, loading, error, onRetry }: Props) {
  const [period, setPeriod] = useState<DashboardDeliveryPeriod>('today')
  const summary = useMemo(() => calculateDeliverySummaryByPeriod(deliveries, period), [deliveries, period])
  const state = loading ? 'loading' : error ? 'error' : summary.scheduled === 0 && summary.inRoute === 0 && summary.delivered === 0 && summary.late === 0 ? 'empty' : 'ready'

  if (loading) {
    return <PageLoading />
  }

  return (
    <Card className="h-full overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-sm font-semibold text-slate-900 sm:text-[15px]">Entregas</CardTitle>

        <Select
          value={period}
          onChange={(event) => setPeriod(event.target.value as DashboardDeliveryPeriod)}
          className="h-8 w-full rounded-lg border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm outline-none sm:w-[108px]"
          aria-label="Filtrar entregas"
        >
          {DELIVERY_PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </CardHeader>

      <CardContent className="p-3.5">
        {state === 'error' ? (
          <EmptyStateAction
            title="Falha ao carregar entregas"
            description={error ?? 'Tente novamente para atualizar o painel.'}
            actionLabel="Tentar novamente"
            onAction={onRetry}
            className="py-8"
          />
        ) : state === 'empty' ? (
          <EmptyStateAction title="Sem entregas no período" description="Amplie o intervalo para visualizar as movimentações." className="py-8" />
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-700">Entregas Programadas</p>
              <p className="text-sm font-semibold text-slate-900">{summary.scheduled}</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-700">Em Rota</p>
              <p className="text-sm font-semibold text-slate-900">{summary.inRoute}</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-700">Entregues</p>
              <p className="text-sm font-semibold text-slate-900">{summary.delivered}</p>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-red-600">Atrasadas</p>
              <p className="text-sm font-semibold text-red-600">{summary.late}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
