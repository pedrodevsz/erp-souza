"use client"

import React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Props = {
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  contentClassName?: string
}

export function SectionCard({
  title,
  description,
  children,
  className = '',
  titleClassName = '',
  descriptionClassName = '',
  contentClassName = '',
}: Props) {
  return (
    <Card className={cn('p-4', className)}>
      <div className={cn('mb-3', contentClassName)}>
        <h3 className={cn('font-semibold text-sky-600', titleClassName)}>{title}</h3>
        {description && (
          <p className={cn('mt-1 text-sm text-gray-500', descriptionClassName)}>{description}</p>
        )}
      </div>
      {children}
    </Card>
  )
}
