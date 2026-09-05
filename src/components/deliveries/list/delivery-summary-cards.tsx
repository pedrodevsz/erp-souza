"use client"

import { SummaryCards } from '@/components/shared'
import { CalendarDays, Clock3, AlertTriangle, Truck } from 'lucide-react'

type Props = {
  deliveriesToday: number
  deliveriesThisMonth: number
  pendingThisWeek: number
  lateDeliveries: number
}

export function DeliverySummaryCards({
  deliveriesToday,
  deliveriesThisMonth,
  pendingThisWeek,
  lateDeliveries,
}: Props) {
  return (
    <SummaryCards
      className="xl:grid-cols-4"
      items={[
        {
          label: 'Entregas Hoje',
          value: String(deliveriesToday),
          icon: <Truck className="h-5 w-5" />,
          tone: 'blue',
        },
        {
          label: 'Entregas no Mês',
          value: String(deliveriesThisMonth),
          icon: <CalendarDays className="h-5 w-5" />,
          tone: 'green',
        },
        {
          label: 'Pendentes Esta Semana',
          value: String(pendingThisWeek),
          icon: <Clock3 className="h-5 w-5" />,
          tone: 'amber',
        },
        {
          label: 'Entregas Atrasadas',
          value: String(lateDeliveries),
          icon: <AlertTriangle className="h-5 w-5" />,
          tone: 'red',
        },
      ]}
    />
  )
}

