"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDateTime, movementTypeTone } from '@/lib/inventory'
import type { InventoryMovement } from '@/types/inventory'
import { ArrowDown, ArrowUpRight, ArrowRightLeft } from 'lucide-react'

type Props = {
  totalProducts: number
  totalStock: number
  totalValue: number
  minimumStock: number
  availableStock: number
  recentMovements: InventoryMovement[]
  categoryBreakdown: Array<{ category: string; count: number; percentage: number }>
}

function MovementIcon({ type }: { type: InventoryMovement['type'] }) {
  if (type === 'Entrada') return <ArrowDown className="h-4 w-4" />
  if (type === 'Saída') return <ArrowUpRight className="h-4 w-4" />
  return <ArrowRightLeft className="h-4 w-4" />
}

export function InventorySidebar({
  totalProducts,
  totalStock,
  totalValue,
  minimumStock,
  availableStock,
  recentMovements,
  categoryBreakdown,
}: Props) {
  return (
    <Tabs defaultValue="resumo" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="resumo">Resumo</TabsTrigger>
        <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        <TabsTrigger value="categorias">Categorias</TabsTrigger>
      </TabsList>

      <TabsContent value="resumo" className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Resumo do Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Produtos Cadastrados</span>
              <strong>{totalProducts}</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Estoque Total</span>
              <strong>{totalStock} un</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Valor Total</span>
              <strong>{formatCurrency(totalValue)}</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Estoque Mínimo</span>
              <strong>{minimumStock} un</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Estoque Disponível</span>
              <strong>{availableStock} un</strong>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="movimentacoes" className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Movimentações Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMovements.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma movimentação encontrada.</p>
            ) : (
              recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                    <MovementIcon type={movement.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">{movement.type} de Estoque</p>
                      <Badge variant={movementTypeTone(movement.type) as never}>{movement.type}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{movement.description}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(movement.date)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categorias" className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Estoque por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryBreakdown.length === 0 ? (
              <p className="text-sm text-slate-500">Sem categorias cadastradas.</p>
            ) : (
              categoryBreakdown.slice(0, 6).map((entry) => (
                <div key={entry.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{entry.category}</span>
                    <span className="font-medium text-slate-900">{entry.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-sky-600" style={{ width: `${Math.max(entry.percentage, 5)}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
