"use client"

import { Card } from '@/components/ui/card'
import { DefinitionList } from '@/components/shared'

type Item = {
  label: string
  value: string
}

type Props = {
  title: string
  items: Item[]
}

export function InventoryDetailsCard({ title, items }: Props) {
  return (
    <Card className="p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-sky-600">{title}</h3>
      <DefinitionList items={items.map((item) => ({ label: item.label, value: item.value }))} />
    </Card>
  )
}

