"use client"

import { Button, CreateButton, Input } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCcwIcon } from 'lucide-react'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  onReset: () => void
  onCreatePurchase: () => void
  onCreateSupplier: () => void
}

export function PurchaseFiltersCard({ search, onSearchChange, onReset, onCreatePurchase, onCreateSupplier }: Props) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div>
          <CardTitle className="text-sm font-semibold text-sky-600">Filtros</CardTitle>
          <p className="text-sm text-slate-500">Filtre compras por fornecedor, nota fiscal, data ou valor.</p>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Buscar por fornecedor, NF ou valor" />
        </div>

        <div className="flex flex-col items-stretch gap-2 xl:items-end">
          <CreateButton name="Nova Compra" onClick={onCreatePurchase} className="w-full xl:w-52" />
          <CreateButton name="Novo Fornecedor" onClick={onCreateSupplier} className="w-full xl:w-52" />
          <Button type="button" variant="outline" onClick={onReset} className="w-full xl:w-52">
            <RefreshCcwIcon className="mr-2 h-4 w-4" />
            Limpar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
