"use client"

import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Tone = 'blue' | 'green' | 'rose' | 'amber' | 'indigo' | 'cyan' | 'red'

const toneClasses: Record<Tone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  rose: 'bg-rose-100 text-rose-700',
  amber: 'bg-amber-100 text-amber-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  red: 'bg-red-100 text-red-700',
}

export type SummaryCardItem = {
  label: string
  value: string
  description?: string
  icon: ReactNode
  tone?: Tone
  footer?: ReactNode
}

type Props = {
  items: SummaryCardItem[]
  className?: string
}

export function SummaryCards({ items, className = '' }: Props) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', className)}>
      {items.map((item) => {
        const tone = item.tone ?? 'blue'

        return (
          <Card key={item.label} className="border-slate-200 shadow-sm">
            <CardContent className="flex h-full items-center gap-4 p-4">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', toneClasses[tone])}>
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="truncate text-xl font-semibold text-slate-900">{item.value}</p>
                {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                {item.footer && <div className="mt-3">{item.footer}</div>}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
