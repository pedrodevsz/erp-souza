"use client"

import React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant | string
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-700',
}

export function Badge({ variant = 'default', className = '', ...props }: Props) {
  const resolved = (variant in variantClasses ? variant : 'default') as Variant
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', variantClasses[resolved], className)}
      {...props}
    />
  )
}

export default Badge
