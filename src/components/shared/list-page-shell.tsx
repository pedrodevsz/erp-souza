"use client"

import React from 'react'
import FilterBar from '@/components/ui/filter-bar'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  newHref?: string
  newLabel?: string
  prefix?: React.ReactNode
  extraButton?: React.ReactNode
  total?: number
  page?: number
  totalPages?: number
  onPrevious?: () => void
  onNext?: () => void
  previousLabel?: string
  nextLabel?: string
  className?: string
  resultsLabel?: string
}

export function ListPageShell({
  children,
  value = '',
  onChange = () => {},
  placeholder = 'Buscar...',
  newHref,
  newLabel = 'Novo',
  prefix,
  extraButton = null,
  total,
  page,
  totalPages,
  onPrevious,
  onNext,
  previousLabel = 'Anterior',
  nextLabel = 'Próxima',
  className = '',
  resultsLabel = 'Resultados',
}: Props) {
  const currentPage = page ?? 1
  const currentTotalPages = totalPages ?? 1
  const showPagination =
    Boolean(typeof total === 'number') &&
    Boolean(typeof page === 'number') &&
    Boolean(typeof totalPages === 'number') &&
    Boolean(onPrevious) &&
    Boolean(onNext)

    return (
    <div className={cn('space-y-4', className)}>
      <FilterBar
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        newHref={newHref}
        newLabel={newLabel}
        prefix={prefix}
        extraButton={extraButton}
      />

      {children}

      {showPagination && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="text-slate-600">
            {resultsLabel}: <span className="font-medium text-slate-900">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onPrevious} disabled={currentPage <= 1} className="min-w-0 flex-1 sm:flex-none">
              {previousLabel}
            </Button>
            <span className="min-w-0 whitespace-nowrap text-center text-slate-600">
              Página {currentPage} de {currentTotalPages}
            </span>
            <Button variant="outline" size="sm" onClick={onNext} disabled={currentPage >= currentTotalPages} className="min-w-0 flex-1 sm:flex-none">
              {nextLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
