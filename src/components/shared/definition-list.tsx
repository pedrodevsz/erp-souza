"use client"

import React from 'react'
import { cn } from '@/lib/utils'

export type DefinitionItem = {
  label: React.ReactNode
  value: React.ReactNode
  hidden?: boolean
  className?: string
  labelClassName?: string
  valueClassName?: string
}

type Props = {
  items: DefinitionItem[]
  columns?: 1 | 2
  className?: string
  emptyMessage?: React.ReactNode
}

export function DefinitionList({
  items,
  columns = 1,
  className = '',
  emptyMessage = 'Não informado',
}: Props) {
  const visibleItems = items.filter((item) => !item.hidden)

  if (visibleItems.length === 0) {
    return <div className={cn('text-sm text-gray-500', className)}>{emptyMessage}</div>
  }

  return (
    <div className={cn('grid gap-3', columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1', className)}>
      {visibleItems.map((item, index) => (
        <div key={index} className={cn('space-y-1', item.className)}>
          <span className={cn('text-sm text-gray-600', item.labelClassName)}>{item.label}</span>
          <div className={cn('font-medium', item.valueClassName)}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}
