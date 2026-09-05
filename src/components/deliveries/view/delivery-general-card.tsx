"use client"

import { Badge } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DefinitionList } from '@/components/shared'
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_VARIANTS, formatDate, formatDateTime } from '@/lib/deliveries'
import type { Delivery } from '@/types/delivery'

type Props = {
  delivery: Delivery
}

export function DeliveryGeneralCard({ delivery }: Props) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Dados Gerais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Número</div>
            <div className="text-2xl font-semibold text-slate-900">{delivery.saleNumber}</div>
          </div>
          <Badge variant={DELIVERY_STATUS_VARIANTS[delivery.status]}>{DELIVERY_STATUS_LABELS[delivery.status]}</Badge>
        </div>

        <DefinitionList
          columns={2}
          items={[
            { label: 'Cliente', value: delivery.customerName },
            { label: 'Telefone', value: delivery.customerPhone },
            { label: 'Venda', value: delivery.saleNumber || delivery.saleId },
            { label: 'Status', value: <Badge variant={DELIVERY_STATUS_VARIANTS[delivery.status]}>{DELIVERY_STATUS_LABELS[delivery.status]}</Badge> },
            { label: 'Motorista', value: delivery.driverName?.trim() || 'Não informado' },
            { label: 'É para entrega?', value: <Badge variant="success">Entrega</Badge> },
            { label: 'Data agendada', value: formatDate(delivery.scheduledDate) },
            { label: 'Entregue em', value: formatDateTime(delivery.deliveredAt) },
          ]}
        />

        {delivery.notes && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{delivery.notes}</p>}
      </CardContent>
    </Card>
  )
}
