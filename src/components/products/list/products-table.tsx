"use client"

import { Eye, PencilLine, Trash2 } from 'lucide-react'
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyStateAction } from '@/components/shared'
import { PageLoading } from '@/components/shared/page-loading'
import { calculateInventoryStatus, formatCurrency, statusLabel, statusTone } from '@/lib/inventories/inventory'
import type { InventoryItem } from '@/types/inventory'

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

export function ProductsTable({ items, loading = false, onView, onEdit, onDelete }: Props) {
  if (loading) {
    return <PageLoading />
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">Produtos</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table className="min-w-[1220px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[240px] min-w-[240px] px-4">Produto</TableHead>
              <TableHead className="w-28 whitespace-nowrap px-4">Código</TableHead>
              <TableHead className="w-32 whitespace-nowrap px-4">Categoria</TableHead>
              <TableHead className="w-[180px] min-w-[180px] px-4">Fornecedor</TableHead>
              <TableHead className="w-24 whitespace-nowrap px-4">Unidade</TableHead>
              <TableHead className="w-28 whitespace-nowrap px-4">Custo</TableHead>
              <TableHead className="w-32 whitespace-nowrap px-4">Preço</TableHead>
              <TableHead className="w-28 whitespace-nowrap px-4">Estoque</TableHead>
              <TableHead className="w-28 whitespace-nowrap px-4">Situação</TableHead>
              <TableHead className="w-[108px] whitespace-nowrap px-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="px-4 py-6 text-center text-slate-500">
                  <EmptyStateAction
                    title="Sem produtos"
                    description="Inclua a primeira compra."
                    actionLabel="Nova Compra"
                    href="/dashboard/purchases/new"
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const stockTone =
                  item.currentStock === 0 ? 'text-red-600' : item.currentStock <= item.minimumStock ? 'text-amber-600' : 'text-emerald-600'

                return (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-2 align-middle">
                      <div>
                        <p className="font-medium text-slate-900">{item.productName}</p>
                        <p className="text-xs text-slate-500">{item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 align-middle whitespace-nowrap">{item.sku}</TableCell>
                    <TableCell className="px-4 py-2 align-middle whitespace-nowrap">{item.category}</TableCell>
                    <TableCell className="px-4 py-2 align-middle whitespace-nowrap">{item.supplier}</TableCell>
                    <TableCell className="px-4 py-2 align-middle whitespace-nowrap">{item.unit}</TableCell>
                    <TableCell className="px-4 py-2 align-middle whitespace-nowrap">{formatCurrency(item.costPrice)}</TableCell>
                    <TableCell className="px-4 py-2 align-middle whitespace-nowrap">{formatCurrency(item.salePrice)}</TableCell>
                    <TableCell className={`px-4 py-2 align-middle whitespace-nowrap font-medium ${stockTone}`}>
                      {new Intl.NumberFormat('pt-BR').format(item.currentStock)} {item.unit}
                    </TableCell>
                    <TableCell className="px-4 py-2 align-middle whitespace-nowrap">
                      <StatusBadge item={item} />
                    </TableCell>
                    <TableCell className="px-4 py-2 align-middle whitespace-nowrap">
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
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
