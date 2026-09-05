"use client"

import React from 'react'
import { cn } from '@/lib/utils'

type Props = React.InputHTMLAttributes<HTMLInputElement>

export function Checkbox({ className = '', ...props }: Props) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-600 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

export default Checkbox

