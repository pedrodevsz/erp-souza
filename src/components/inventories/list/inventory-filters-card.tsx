"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, Input, Select } from '@/components/ui'
import { Search, Filter, RotateCcw } from 'lucide-react'
import type { InventoryStatus } from '@/types/inventory'

type Props = {
  search: string
  category: string
  supplier: string
  status: InventoryStatus | 'all'
  categories: string[]
  suppliers: string[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSupplierChange: (value: string) => void
  onStatusChange: (value: InventoryStatus | 'all') => void
  onApply: () => void
  onReset: () => void
}

export function InventoryFiltersCard({
  search,
  category,
  supplier,
  status,
  categories,
  suppliers,
  onSearchChange,
  onCategoryChange,
  onSupplierChange,
  onStatusChange,
  onApply,
  onReset,
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Buscar produto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Nome, SKU, categoria ou fornecedor"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Categoria</label>
            <Select value={category} onChange={(e) => onCategoryChange(e.target.value)} className="w-full">
              <option value="all">Todas as categorias</option>
              {categories.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Fornecedor</label>
            <Select value={supplier} onChange={(e) => onSupplierChange(e.target.value)} className="w-full">
              <option value="all">Todos os fornecedores</option>
              {suppliers.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status do Estoque</label>
            <Select value={status} onChange={(e) => onStatusChange(e.target.value as InventoryStatus | 'all')} className="w-full">
              <option value="all">Todos</option>
              <option value="EM_ESTOQUE">Em Estoque</option>
              <option value="ESTOQUE_BAIXO">Estoque Baixo</option>
              <option value="SEM_ESTOQUE">Sem Estoque</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar
          </Button>
          <Button type="button" onClick={onApply}>
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
