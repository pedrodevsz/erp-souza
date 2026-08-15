import type { ReactNode } from 'react'

export type MetricTone = 'blue' | 'green' | 'purple' | 'red' | 'orange'
export type MetricState = 'loading' | 'error' | 'empty' | 'ready'

export type DashboardSummaryActionHandlers = {
  onOpenCustomer: () => void
  onOpenSupplier: () => void
  onOpenEmployeeManager: () => void
}

export type DashboardMetricToneStyle = {
  accent: string
  iconBg: string
  icon: string
  value: string
  border: string
}

export type DashboardActionCardProps = {
  href: string
  title: string
  description: string
  icon: ReactNode
  tone: MetricTone
  className?: string
}

export type DashboardMetricCardProps = {
  title: string
  description: string
  value: string
  tone: MetricTone
  icon: ReactNode
  state: MetricState
  emptyDescription: string
  onRetry: () => void
  series: number[]
}
