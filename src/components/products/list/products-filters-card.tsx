"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, Input, Select } from '@/components/ui'
import { Filter, RotateCcw, Search } from 'lucide-react'

type Props = {
  search: string
  category: string
  supplier: string
  categories: string[]
  suppliers: string[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSupplierChange: (value: string) => void
  onApply: () => void
  onReset: () => void
}

export function ProductsFiltersCard({
  search,
  category,
  supplier,
  categories,
  suppliers,
  onSearchChange,
  onCategoryChange,
  onSupplierChange,
  onApply,
  onReset,
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Buscar produto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Nome, código ou referência"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Categoria</label>
            <Select value={category} onChange={(event) => onCategoryChange(event.target.value)} className="w-full">
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
            <Select value={supplier} onChange={(event) => onSupplierChange(event.target.value)} className="w-full">
              <option value="all">Todos os fornecedores</option>
              {suppliers.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
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
