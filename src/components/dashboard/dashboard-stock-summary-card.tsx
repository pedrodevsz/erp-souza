"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { PageLoading } from '@/components/shared/page-loading'
import { EmptyStateAction } from '@/components/shared'
import { calculateInventorySummary, calculateInventoryBreakdown, formatDashboardNumber } from '@/lib/dashboard'
import type { DashboardOverviewSectionProps } from '@/types/dashboard'

type Props = Pick<DashboardOverviewSectionProps, 'inventoryItems' | 'loading' | 'error' | 'onRetry'>

const STOCK_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#94a3b8']

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
})

const integerFormatter = new Intl.NumberFormat('pt-BR')

export function DashboardStockSummaryCard({ inventoryItems, loading, error, onRetry }: Props) {
  const summary = useMemo(() => calculateInventorySummary(inventoryItems), [inventoryItems])
  const breakdown = useMemo(() => calculateInventoryBreakdown(inventoryItems), [inventoryItems])
  const total = summary.totalItems
  const state = loading ? 'loading' : error ? 'error' : total === 0 ? 'empty' : 'ready'

  const segments = useMemo(() => {
    if (total === 0) return []

    let offset = 0
    return breakdown.map((entry, index) => {
      const size = (entry.value / total) * 100
      const segment = {
        color: STOCK_COLORS[index],
        start: offset,
        end: offset + size,
      }
      offset += size
      return segment
    })
  }, [breakdown, total])

  const donutStyle = segments.length
    ? { background: `conic-gradient(${segments.map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`).join(', ')})` }
    : { background: 'conic-gradient(#e2e8f0 0% 100%)' }

  if (loading) {
    return <PageLoading />
  }

  return (
    <Card className="h-full overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-4 py-3.5">
        <CardTitle className="text-sm font-semibold text-slate-900 sm:text-[15px]">Resumo de Estoque</CardTitle>
      </CardHeader>

      <CardContent className="p-3.5">
        {state === 'error' ? (
          <EmptyStateAction
            title="Falha ao carregar estoque"
            description={error ?? 'Tente novamente para ver o resumo.'}
            actionLabel="Tentar novamente"
            onAction={onRetry}
            className="py-8"
          />
        ) : state === 'empty' ? (
          <EmptyStateAction title="Sem itens cadastrados" description="Cadastre produtos para ver o resumo." className="py-8" />
        ) : (
          <div className="grid items-center gap-4 lg:grid-cols-[156px_minmax(0,1fr)]">
            <div className="relative mx-auto h-32 w-32 sm:h-40 sm:w-40">
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]" style={donutStyle} />
              <div className="absolute inset-[18px] rounded-full bg-white shadow-[0_0_0_1px_rgba(148,163,184,0.08)] sm:inset-[22px]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{integerFormatter.format(total)}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Itens Cadastrados</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {breakdown.map((entry, index) => {
                const percentage = total === 0 ? 0 : (entry.value / total) * 100
                return (
                  <div key={entry.label} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STOCK_COLORS[index] }} />
                      <p className="text-sm text-slate-700">{entry.label}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatDashboardNumber(entry.value)} <span className="text-slate-500">({percentFormatter.format(percentage)}%)</span>
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
