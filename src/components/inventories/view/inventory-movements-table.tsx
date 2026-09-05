"use client"

import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/shared/page-loading'
import { EmptyStateAction } from '@/components/shared'
import type { InventoryMovement } from '@/types/inventory'
import { formatDateTime, movementTypeTone } from '@/lib/inventories/inventory'

type Props = {
  movements: InventoryMovement[]
  loading?: boolean
  itemId: string
}

export function InventoryMovementsTable({ movements, loading = false, itemId }: Props) {
  if (loading) {
    return <PageLoading />
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">Movimentações</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-slate-500">
                  <EmptyStateAction
                    title="Sem movimentações"
                    description="Abra o item para ajustar o estoque."
                    actionLabel="Editar item"
                    href={`/dashboard/stock/${itemId}/edit`}
                  />
                </TableCell>
              </TableRow>
            ) : (
              movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{formatDateTime(movement.date)}</TableCell>
                  <TableCell>
                    <Badge variant={movementTypeTone(movement.type)}>{movement.type}</Badge>
                  </TableCell>
                  <TableCell>{movement.quantity}</TableCell>
                  <TableCell>{movement.description}</TableCell>
                  <TableCell>{movement.user}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
