"use client"

import { Badge, Checkbox } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DeliveryItem } from '@/types/delivery'

type Props = {
  items: DeliveryItem[]
  deliveredCount: number
  totalCount: number
  onToggleItem: (itemId: string, delivered: boolean) => void
  disabled?: boolean
}

export function DeliveryItemsTable({ items, deliveredCount, totalCount, onToggleItem, disabled = false }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Produtos da Entrega</CardTitle>
        <div className="text-sm text-slate-500">
          {deliveredCount} de {totalCount} concluídos
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-3 pr-4">Produto</th>
                <th className="py-3 pr-4">SKU</th>
                <th className="py-3 pr-4">Quantidade</th>
                <th className="py-3 pr-4">Unidade</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium">{item.productName}</td>
                  <td className="py-3 pr-4">{item.sku}</td>
                  <td className="py-3 pr-4">{item.quantity}</td>
                  <td className="py-3 pr-4">{item.unit}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={item.delivered ? 'success' : 'warning'}>{item.delivered ? 'Entregue' : 'Pendente'}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <Checkbox
                        checked={item.delivered}
                        onChange={() => onToggleItem(item.id, item.delivered)}
                        disabled={disabled}
                      />
                      <span>{item.delivered ? 'Entregue' : 'Marcar como entregue'}</span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
