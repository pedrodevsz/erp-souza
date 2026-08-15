"use client"

import { Eye, PencilLine, Trash2 } from 'lucide-react'
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyStateAction } from '@/components/shared'
import { PageLoading } from '@/components/shared/page-loading'
import type { InventoryItem } from '@/types/inventory'
import { calculateInventoryStatus, formatDate, statusLabel, statusTone } from '@/lib/inventory'

type Props = {
  items: InventoryItem[]
  loading?: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function StatusBadge({ item }: { item: InventoryItem }) {
  const status = calculateInventoryStatus(item)
  return <Badge variant={statusTone(status)}>{statusLabel(status)}</Badge>
}

export function InventoryTable({ items, loading = false, onView, onEdit, onDelete }: Props) {
  if (loading) {
    return <PageLoading />
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">Produtos</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table className="min-w-[1500px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px] min-w-[280px] px-4">Produto</TableHead>
              <TableHead className="w-32 whitespace-nowrap px-4">SKU</TableHead>
              <TableHead className="w-36 whitespace-nowrap px-4">Categoria</TableHead>
              <TableHead className="w-36 whitespace-nowrap px-4">Estoque Atual</TableHead>
              <TableHead className="w-32 whitespace-nowrap px-4">Reservado</TableHead>
              <TableHead className="w-32 whitespace-nowrap px-4">Disponível</TableHead>
              <TableHead className="w-36 whitespace-nowrap px-4">Estoque Mínimo</TableHead>
              <TableHead className="w-32 whitespace-nowrap px-4">Status</TableHead>
              <TableHead className="w-[220px] min-w-[220px] px-4">Fornecedor</TableHead>
              <TableHead className="w-36 whitespace-nowrap px-4">Última Entrada</TableHead>
              <TableHead className="w-[130px] whitespace-nowrap px-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="px-4 py-8 text-center text-slate-500">
                  <EmptyStateAction
                    title="Sem itens"
                    description="Cadastre o primeiro item."
                    actionLabel="Cadastrar Item"
                    href="/dashboard/stock/new"
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.unit}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{item.sku}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{item.category}</TableCell>
                  <TableCell className={`px-4 py-3 whitespace-nowrap ${item.currentStock === 0 ? 'text-red-600' : item.currentStock <= item.minimumStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {item.currentStock} {item.unit}
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{item.reservedStock} {item.unit}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{item.availableStock} {item.unit}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{item.minimumStock} {item.unit}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge item={item} />
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{item.supplier}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{formatDate(item.lastEntryDate)}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="icon" onClick={() => onView(item.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => onEdit(item.id)}>
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="destructive" size="icon" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
