"use client"

import { cn } from '@/lib/utils'

type Props = {
  label?: string
  className?: string
}

export function PageLoading({ label = 'Carregando...', className = '' }: Props) {
  return (
    <div
      className={cn('flex min-h-[60vh] w-full items-center justify-center px-6 py-10', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
