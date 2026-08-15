"use client"

import { useMemo } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Printer } from 'lucide-react'
import { Button } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type CategoryEntry = {
  category: string
  count: number
  percentage: number
}

type StatusEntry = {
  label: string
  count: number
  variant: 'success' | 'warning' | 'danger'
}

type Props = {
  categoryBreakdown: CategoryEntry[]
  statusBreakdown: StatusEntry[]
  onQuickAction: (action: 'import' | 'export' | 'print') => void
}

function QuickActionButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <Button type="button" variant="outline" size="sm" className="w-full justify-start" onClick={onClick}>
      {icon}
      {label}
    </Button>
  )
}

export function ProductsSidebar({ categoryBreakdown, statusBreakdown, onQuickAction }: Props) {
  const topCategories = useMemo(() => categoryBreakdown.slice(0, 6), [categoryBreakdown])

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Estoque por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topCategories.length === 0 ? (
            <p className="text-sm text-slate-500">Sem categorias cadastradas.</p>
          ) : (
            topCategories.map((entry) => (
              <div key={entry.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{entry.category}</span>
                  <span className="font-medium text-slate-900">{entry.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-sky-600" style={{ width: `${Math.max(entry.percentage, 5)}%` }} />
                </div>
              </div>
            ))
          )}

          <Button type="button" variant="outline" size="sm" className="w-full">
            Ver todas as categorias
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Situação dos Produtos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {statusBreakdown.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    entry.variant === 'success' && 'bg-emerald-500',
                    entry.variant === 'warning' && 'bg-amber-500',
                    entry.variant === 'danger' && 'bg-red-500'
                  )}
                />
                <span className="text-slate-600">{entry.label}</span>
              </div>
              <strong className="text-slate-900">{entry.count}</strong>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <QuickActionButton
            label="Importar Produtos"
            icon={<ArrowUpFromLine className="h-4 w-4" />}
            onClick={() => onQuickAction('import')}
          />
          <QuickActionButton
            label="Exportar Produtos"
            icon={<ArrowDownToLine className="h-4 w-4" />}
            onClick={() => onQuickAction('export')}
          />
          <QuickActionButton
            label="Imprimir Lista"
            icon={<Printer className="h-4 w-4" />}
            onClick={() => onQuickAction('print')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
