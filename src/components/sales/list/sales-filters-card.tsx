"use client"

import { Button, Input, Select } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateButton } from '@/components/ui'
import type { SaleFilters } from '@/types/sale'
import { SALE_DELIVERY_STATUS_LABELS, SALE_PAYMENT_METHODS } from '@/lib/sales'
import { RefreshCcwIcon } from 'lucide-react'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  filters: SaleFilters
  onFiltersChange: (filters: Partial<SaleFilters>) => void
  onReset: () => void
}

export function SalesFiltersCard({ search, onSearchChange, filters, onFiltersChange, onReset }: Props) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div>
          <CardTitle className="text-sm font-semibold text-sky-600">Filtros</CardTitle>
          <p className="text-sm text-slate-500">Filtre vendas por cliente, número, entrega e forma de pagamento.</p>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Buscar cliente, número da venda ou vendedor" />
        </div>
        <div className="flex items-start xl:justify-end">
          <CreateButton href="/dashboard/sales/new" name="Nova Venda" />
        </div>
        <div>
          <Select value={filters.deliveryStatus} onChange={(e) => onFiltersChange({ deliveryStatus: e.target.value as SaleFilters['deliveryStatus'] })}>
            <option value="all">Todos os status de entrega</option>
            {Object.entries(SALE_DELIVERY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Select value={filters.paymentMethod} onChange={(e) => onFiltersChange({ paymentMethod: e.target.value })}>
            <option value="all">Todas as formas</option>
            {SALE_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end xl:justify-end">
          <Button type="button" variant="outline" onClick={onReset}>
            <RefreshCcwIcon />  Limpar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
