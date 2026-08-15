"use client"

import { AlertTriangle, CheckCircle2, Pencil, Route } from 'lucide-react'
import { Button } from '@/components/ui'
import type { DeliveryStatus } from '@/types/delivery'

type Props = {
  deliveryStatus: DeliveryStatus
  onMarkInRoute: () => void
  onCompleteDelivery: () => void
  onEdit: () => void
  onCancel: () => void
}

export function DeliveryActions({
  deliveryStatus,
  onMarkInRoute,
  onCompleteDelivery,
  onEdit,
  onCancel,
}: Props) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        variant="outline"
        onClick={onMarkInRoute}
        disabled={deliveryStatus === 'CANCELLED' || deliveryStatus === 'DELIVERED'}
      >
        <Route className="mr-2 h-4 w-4" />
        Marcar em rota
      </Button>
      <Button
        variant="outline"
        onClick={onCompleteDelivery}
        disabled={deliveryStatus === 'CANCELLED' || deliveryStatus === 'DELIVERED'}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Concluir entrega
      </Button>
      <Button variant="outline" onClick={onEdit}>
        <Pencil className="mr-2 h-4 w-4" />
        Editar
      </Button>
      <Button variant="destructive" onClick={onCancel} disabled={deliveryStatus === 'CANCELLED'}>
        <AlertTriangle className="mr-2 h-4 w-4" />
        Cancelar entrega
      </Button>
    </div>
  )
}
