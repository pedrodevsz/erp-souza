"use client"

import { useMemo } from 'react'
import { Button, Card, CardContent, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'
import { dashboardMetricStyles } from './dashboard-styles'
import type { DashboardMetricCardProps } from './dashboard.types'

export function MetricCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-[18px] border-slate-200 shadow-sm">
      <CardContent className="space-y-3 p-3.5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-2.5 w-28" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

function Sparkline({ points, color }: { points: string; color: string }) {
  return (
    <svg viewBox="0 0 100 18" className="h-8 w-full">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={color}
      />
    </svg>
  )
}

export function MetricCard({
  title,
  description,
  value,
  tone,
  icon,
  state,
  emptyDescription,
  onRetry,
  series,
}: DashboardMetricCardProps) {
  const style = dashboardMetricStyles[tone]
  const points = useMemo(() => {
    if (!series.length) return '0,18 100,18'
    const width = 100
    const height = 18
    const min = Math.min(...series)
    const max = Math.max(...series)
    const span = max - min || 1
    return series
      .map((value, index) => {
        const x = (index / Math.max(1, series.length - 1)) * width
        const y = height - ((value - min) / span) * height
        return `${x},${y}`
      })
      .join(' ')
  }, [series])

  if (state === 'loading') {
    return <MetricCardSkeleton />
  }

  return (
    <Card className={cn('overflow-hidden rounded-[18px] border-slate-200 bg-white shadow-sm', style.border)}>
      <CardContent className="flex min-h-[116px] flex-col gap-2.5 p-3.5">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-100', style.accent, style.icon)}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{title}</p>
            {state === 'ready' && <p className={cn('mt-0.5 break-words text-[15px] font-semibold leading-tight sm:text-[16px]', style.value)}>{value}</p>}
            {state === 'error' && <p className="mt-1 text-[11px] font-medium text-red-600">Falha ao carregar</p>}
            {state === 'empty' && <p className="mt-1 text-[11px] font-medium text-slate-700">{emptyDescription}</p>}
          </div>
        </div>

        <div className="mt-auto">
          {state === 'ready' && <Sparkline points={points} color={style.icon} />}
          {state === 'error' && <Button type="button" variant="outline" className="h-7 text-[11px]" onClick={onRetry}>Tentar novamente</Button>}
          {state === 'empty' && <Sparkline points={points} color={style.icon} />}
        </div>
        <p className="text-[10px] leading-tight text-slate-500">{description}</p>
      </CardContent>
    </Card>
  )
}
