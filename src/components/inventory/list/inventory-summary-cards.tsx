"use client"

import { Badge } from '@/components/ui'
import { SummaryCards } from '@/components/shared'
import { CircleDollarSign, Package, Tags } from 'lucide-react'

type Props = {
  totalProducts: number
  itemsInStock: number
  lowStock: number
  noStock: number
  totalValue: number
}

export function InventorySummaryCards({
  totalProducts,
  itemsInStock,
  lowStock,
  noStock,
  totalValue,
}: Props) {
  return (
    <SummaryCards
      className="xl:grid-cols-5"
      items={[
        {
          label: 'Itens cadastrados',
          value: String(totalProducts),
          tone: 'blue',
          icon: <Package className="h-5 w-5" />,
        },
        {
          label: 'Disponíveis em estoque',
          value: String(itemsInStock),
          tone: 'green',
          icon: <Package className="h-5 w-5" />,
        },
        {
          label: 'Abaixo do mínimo',
          value: String(lowStock),
          tone: 'amber',
          icon: <Tags className="h-5 w-5" />,
        },
        {
          label: 'Sem estoque',
          value: String(noStock),
          tone: 'red',
          icon: <Package className="h-5 w-5" />,
        },
        {
          label: 'Valor total do estoque',
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue),
          tone: 'blue',
          icon: <CircleDollarSign className="h-5 w-5" />,
          footer: (
            <Badge variant="info" className="w-fit">
              Base real
            </Badge>
          ),
        },
      ]}
    />
  )
}
