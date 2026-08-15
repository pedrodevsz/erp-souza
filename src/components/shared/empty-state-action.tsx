"use client"

import Link from 'next/link'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description: string
  actionLabel?: string
  href?: string
  onAction?: () => void
  className?: string
}

export function EmptyStateAction({ title, description, actionLabel, href, onAction, className }: Props) {
  const button = actionLabel ? (
    href ? (
      <Button asChild>
        <Link href={href}>{actionLabel}</Link>
      </Button>
    ) : (
      <Button type="button" onClick={onAction}>
        {actionLabel}
      </Button>
    )
  ) : null

  return (
    <div className={cn('flex flex-col items-center gap-3 py-6 text-center', className)}>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {button}
    </div>
  )
}
