"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { PageLoading } from '@/components/shared/page-loading'
import { EmptyStateAction } from '@/components/shared'
import { buildMonthlySeries, formatDashboardCurrency } from '@/lib/dashboard'
import type { DashboardOverviewSectionProps } from '@/types/dashboard'

type Props = Pick<DashboardOverviewSectionProps, 'sales' | 'loading' | 'error' | 'onRetry'>

function capitalizeMonth(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatCompactCurrency(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 'R$ 0'
  }

  if (value >= 1000) {
    return `R$ ${Math.round(value / 1000)}k`
  }

  return formatDashboardCurrency(value).replace(',00', '')
}

function buildChartPoints(values: number[], width: number, height: number, padding = { top: 10, right: 16, bottom: 28, left: 36 }) {
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(...values, 1)

  return values.map((value, index) => {
    const x = padding.left + (index / Math.max(1, values.length - 1)) * chartWidth
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight
    return { x, y }
  })
}

export function DashboardSalesChartCard({ sales, loading, error, onRetry }: Props) {
  const series = useMemo(() => buildMonthlySeries(sales, 6, (sale) => sale.saleDate, (sale) => sale.total), [sales])
  const values = series.map((point) => point.value)
  const hasData = values.some((value) => value > 0)
  const state = loading ? 'loading' : error ? 'error' : !hasData ? 'empty' : 'ready'
  const width = 320
  const height = 160
  const points = useMemo(() => buildChartPoints(values, width, height), [values])
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ')

  const plotAreaBottom = height - 28
  const chartMax = Math.max(...values, 1)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => chartMax * ratio)

  if (loading) {
    return <PageLoading />
  }

  return (
    <Card className="h-full overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 px-4 py-3.5">
        <CardTitle className="text-sm font-semibold text-slate-900 sm:text-[15px]">Vendas nos Últimos 6 Meses</CardTitle>
      </CardHeader>

      <CardContent className="p-3.5">
        {state === 'error' ? (
          <EmptyStateAction
            title="Falha ao carregar vendas"
            description={error ?? 'Tente novamente para ver o gráfico.'}
            actionLabel="Tentar novamente"
            onAction={onRetry}
            className="py-8"
          />
        ) : state === 'empty' ? (
          <EmptyStateAction title="Sem vendas no período" description="Ainda não há faturamento para exibir." className="py-8" />
        ) : (
          <div className="space-y-2.5">
            <div className="overflow-hidden">
              <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full sm:h-40">
                <defs>
                  <linearGradient id="sales-line-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {ticks.map((tick) => {
                  const y = height - 28 - (tick / chartMax) * (height - 38)
                  return (
                    <g key={tick}>
                      <line x1="38" x2={width - 16} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                      <text x="0" y={y + 4} fill="#64748b" fontSize="8">
                        {formatCompactCurrency(tick)}
                      </text>
                    </g>
                  )
                })}

                <polyline
                  points={`${linePoints} ${width - 16},${plotAreaBottom}`}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polygon
                  points={`38,${plotAreaBottom} ${linePoints} ${width - 16},${plotAreaBottom}`}
                  fill="url(#sales-line-gradient)"
                  opacity="0.85"
                />

                {points.map((point, index) => (
                  <g key={series[index].label}>
                    <circle cx={point.x} cy={point.y} r="3.4" fill="#fff" stroke="#2563eb" strokeWidth="2" />
                    <title>{`${capitalizeMonth(series[index].label)}: ${formatDashboardCurrency(values[index])}`}</title>
                  </g>
                ))}

                {series.map((point, index) => (
                    <text key={point.label} x={points[index].x} y={height - 7} textAnchor="middle" fill="#64748b" fontSize="8">
                    {capitalizeMonth(point.label)}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
