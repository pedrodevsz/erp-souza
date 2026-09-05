"use client"

import React from 'react'
import { cn } from '@/lib/utils'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({ className = '', orientation = 'horizontal', ...props }: Props) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === 'horizontal' ? 'h-px w-full bg-slate-200' : 'w-px self-stretch bg-slate-200',
        className
      )}
      {...props}
    />
  )
}

export default Separator
