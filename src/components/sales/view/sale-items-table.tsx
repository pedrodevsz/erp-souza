"use client"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyStateAction } from '@/components/shared'
import { formatCurrency } from '@/lib/sales'
import type { SaleItem } from '@/types/sale'

type Props = {
  items: SaleItem[]
  saleId: string
}

export function SaleItemsTable({ items, saleId }: Props) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Produtos</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Preço Unitário</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-slate-500">
                  <EmptyStateAction
                    title="Sem produtos"
                    description="Edite a venda para incluir itens."
                    actionLabel="Editar venda"
                    href={`/dashboard/sales/${saleId}/edit`}
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>
                    <Badge variant={item.availableStock > 0 ? 'success' : 'danger'}>{item.availableStock}</Badge>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(item.discount)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
