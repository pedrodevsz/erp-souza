import type { MetricTone, DashboardMetricToneStyle } from './dashboard.types'

export const dashboardMetricStyles: Record<MetricTone, DashboardMetricToneStyle> = {
  blue: {
    accent: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    icon: 'text-blue-600',
    value: 'text-blue-700',
    border: 'border-blue-100',
  },
  green: {
    accent: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    value: 'text-emerald-700',
    border: 'border-emerald-100',
  },
  purple: {
    accent: 'bg-violet-50',
    iconBg: 'bg-violet-100',
    icon: 'text-violet-600',
    value: 'text-violet-700',
    border: 'border-violet-100',
  },
  red: {
    accent: 'bg-rose-50',
    iconBg: 'bg-rose-100',
    icon: 'text-rose-600',
    value: 'text-rose-700',
    border: 'border-rose-100',
  },
  orange: {
    accent: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    icon: 'text-orange-600',
    value: 'text-orange-700',
    border: 'border-orange-100',
  },
}
