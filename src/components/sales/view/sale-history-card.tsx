"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SaleHistoryEntry } from '@/types/sale'

type Props = {
  history: SaleHistoryEntry[]
}

const actionLabel: Record<SaleHistoryEntry['action'], string> = {
  created: 'Criada',
  updated: 'Atualizada',
  delivered: 'Entregue',
  cancelled: 'Cancelada',
  payment_added: 'Pagamento',
}

export function SaleHistoryCard({ history }: Props) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Histórico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum histórico disponível.</p>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.action === 'delivered' ? 'success' : entry.action === 'cancelled' ? 'danger' : 'neutral'}>
                      {actionLabel[entry.action]}
                    </Badge>
                    <span className="text-sm font-medium text-slate-900">{entry.description}</span>
                  </div>
                  <span className="text-xs text-slate-500">{entry.date.slice(0, 19).replace('T', ' ')}</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">Responsável: {entry.user}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
