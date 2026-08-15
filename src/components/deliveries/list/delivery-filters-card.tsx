"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, Input, Select } from '@/components/ui'
import type { DeliveryFilters } from '@/types/delivery'
import { RefreshCcwIcon } from 'lucide-react'

type Props = {
  search: string
  filters: DeliveryFilters
  onSearchChange: (value: string) => void
  onFiltersChange: (filters: Partial<DeliveryFilters>) => void
  onReset: () => void
}

export function DeliveryFiltersCard({ search, filters, onSearchChange, onFiltersChange, onReset }: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">Filtros</CardTitle>
          <p className="text-sm text-slate-500">Filtre entregas por status, cidade, motorista e intervalo de datas.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Buscar</label>
            <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Cliente, venda ou produto" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <Select value={filters.status} onChange={(event) => onFiltersChange({ status: event.target.value as DeliveryFilters['status'] })}>
              <option value="all">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="IN_ROUTE">Em rota</option>
              <option value="PARTIALLY_DELIVERED">Parcialmente entregue</option>
              <option value="DELIVERED">Entregue</option>
              <option value="CANCELLED">Cancelada</option>
              <option value="LATE">Atrasada</option>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Cidade</label>
            <Input value={filters.city} onChange={(event) => onFiltersChange({ city: event.target.value })} placeholder="Filtrar cidade" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Motorista</label>
            <Input
              value={filters.driverName}
              onChange={(event) => onFiltersChange({ driverName: event.target.value })}
              placeholder="Filtrar motorista"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Data inicial</label>
            <Input type="date" value={filters.dateFrom} onChange={(event) => onFiltersChange({ dateFrom: event.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Data final</label>
            <Input type="date" value={filters.dateTo} onChange={(event) => onFiltersChange({ dateTo: event.target.value })} />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onReset}>
            <RefreshCcwIcon className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
