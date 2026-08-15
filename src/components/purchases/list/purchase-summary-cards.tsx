"use client"

import { SummaryCards } from '@/components/shared'
import { formatCurrency } from '@/lib/sales'
import { CalendarDays, CircleCheckBig, ClipboardList, BadgeDollarSign } from 'lucide-react'

type Props = {
  totalPurchases: number
  monthlyPurchases: number
  totalAmount: number
  invoiceIssued: number
}

const cards = [
  {
    key: 'totalPurchases',
    label: 'Total de Compras',
    icon: ClipboardList,
    tone: 'text-sky-700 bg-sky-50',
  },
  {
    key: 'monthlyPurchases',
    label: 'Compras no mês',
    icon: CalendarDays,
    tone: 'text-indigo-700 bg-indigo-50',
  },
  {
    key: 'totalAmount',
    label: 'Valor total comprado',
    icon: BadgeDollarSign,
    tone: 'text-emerald-700 bg-emerald-50',
  },
  {
    key: 'invoiceIssued',
    label: 'Compras com NF',
    icon: CircleCheckBig,
    tone: 'text-cyan-700 bg-cyan-50',
  },
] as const

export function PurchaseSummaryCards({
  totalPurchases,
  monthlyPurchases,
  totalAmount,
  invoiceIssued,
}: Props) {
  const values: Record<(typeof cards)[number]['key'], number> = {
    totalPurchases,
    monthlyPurchases,
    totalAmount,
    invoiceIssued,
  }

  return (
    <SummaryCards
      className="xl:grid-cols-4"
      items={cards.map((card) => {
        const Icon = card.icon
        const value = values[card.key]
        const formatted = card.key === 'totalAmount' ? formatCurrency(value) : String(value)

        return {
          label: card.label,
          value: formatted,
          icon: <Icon className="h-5 w-5" />,
          tone:
            card.key === 'totalPurchases'
              ? 'blue'
              : card.key === 'monthlyPurchases'
                ? 'indigo'
                : card.key === 'totalAmount'
                  ? 'green'
                  : 'cyan',
        }
      })}
    />
  )
}
