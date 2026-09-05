"use client"

import { SummaryCards } from '@/components/shared'
import { formatCurrency } from '@/lib/sales'
import { BadgeDollarSign, CalendarDays, CircleCheckBig, Clock3, ShoppingCart } from 'lucide-react'

type Props = {
  totalSales: number
  monthlySales: number
  totalAmount: number
  deliveriesPending: number
  deliveredOrders: number
}

const cards = [
  {
    key: 'totalSales',
    label: 'Total de Vendas',
    icon: ShoppingCart,
    tone: 'text-sky-700 bg-sky-50',
  },
  {
    key: 'monthlySales',
    label: 'Vendas no mês',
    icon: CalendarDays,
    tone: 'text-indigo-700 bg-indigo-50',
  },
  {
    key: 'totalAmount',
    label: 'Valor vendido',
    icon: BadgeDollarSign,
    tone: 'text-emerald-700 bg-emerald-50',
  },
  {
    key: 'deliveriesPending',
    label: 'Entregas pendentes',
    icon: Clock3,
    tone: 'text-amber-700 bg-amber-50',
  },
  {
    key: 'deliveredOrders',
    label: 'Pedidos entregues',
    icon: CircleCheckBig,
    tone: 'text-cyan-700 bg-cyan-50',
  },
] as const

export function SalesSummaryCards({ totalSales, monthlySales, totalAmount, deliveriesPending, deliveredOrders }: Props) {
  const values: Record<(typeof cards)[number]['key'], number> = {
    totalSales,
    monthlySales,
    totalAmount,
    deliveriesPending,
    deliveredOrders,
  }

  return (
    <SummaryCards
      className="xl:grid-cols-5"
      items={cards.map((card) => {
        const Icon = card.icon
        const value = values[card.key]
        const formatted = card.key === 'totalAmount' ? formatCurrency(value) : value.toString()

        return {
          label: card.label,
          value: formatted,
          icon: <Icon className="h-5 w-5" />,
          tone:
            card.key === 'totalSales'
              ? 'blue'
              : card.key === 'monthlySales'
                ? 'indigo'
                : card.key === 'totalAmount'
                  ? 'green'
                  : card.key === 'deliveriesPending'
                    ? 'amber'
                    : 'cyan',
        }
      })}
    />
  )
}
