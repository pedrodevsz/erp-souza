"use client"

import { SummaryCards } from '@/components/shared'
import { BarChart3, BookmarkCheck, Package } from 'lucide-react'

type Props = {
  totalProducts: number
  totalBrands: number
  totalReserved: number
}

export function ProductsSummaryCards({ totalProducts, totalBrands, totalReserved }: Props) {
  return (
    <SummaryCards
      className="xl:grid-cols-3"
      items={[
        {
          label: 'Total de Produtos',
          value: String(totalProducts),
          tone: 'blue',
          icon: <Package className="h-5 w-5" />,
        },
        {
          label: 'Reservados',
          value: String(totalReserved),
          tone: 'green',
          icon: <BookmarkCheck className="h-5 w-5" />,
        },
        {
          label: 'Marcas',
          value: String(totalBrands),
          tone: 'indigo',
          icon: <BarChart3 className="h-5 w-5" />,
        },
      ]}
    />
  )
}
