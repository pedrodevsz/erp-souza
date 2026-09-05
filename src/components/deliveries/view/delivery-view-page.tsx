"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { PageLoading } from '@/components/shared/page-loading'
import { AlertDialog, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { useToast } from '@/components/ui/toast-provider'
import { useDeliveries } from '@/hooks/deliveries/useDeliveries'
import { useDeliveryStore } from '@/stores/useDeliveryStore'
import type { Delivery } from '@/types/delivery'
import { DeliveryActions } from './delivery-actions'
import { DeliveryGeneralCard } from './delivery-general-card'
import { DeliveryItemsTable } from './delivery-items-table'

type Props = {
  id: string
}

export function DeliveryViewPage({ id }: Props) {
  const router = useRouter()
  const toast = useToast()
  const {
    hydrated,
    findDeliveryById,
    markAsInRoute,
    markItemAsDelivered,
    markItemAsPending,
    completeDelivery,
    cancelDelivery,
    selectDelivery,
    clearSelectedDelivery,
  } = useDeliveries()
  const [loadingDelivery, setLoadingDelivery] = useState(true)
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  useEffect(() => {
    if (!hydrated) return

    let active = true

    async function load() {
      setLoadingDelivery(true)
      const found = await findDeliveryById(id)
      if (!active) return
      setDelivery(found)
      setLoadingDelivery(false)
    }

    load()
    selectDelivery(id)

    return () => {
      active = false
      clearSelectedDelivery()
    }
  }, [clearSelectedDelivery, findDeliveryById, hydrated, id, selectDelivery])

  const handleMarkInRoute = async () => {
    const updated = await markAsInRoute(id)
    if (updated) {
      setDelivery(updated)
      toast.push({ title: 'Sucesso', description: 'Entrega marcada como em rota.', type: 'success' })
      return
    }

    toast.push({
      title: 'Erro',
      description: useDeliveryStore.getState().error ?? 'Não foi possível atualizar a entrega.',
      type: 'error',
    })
  }

  const confirmComplete = async () => {
    const updated = await completeDelivery(id)
    if (updated) {
      setDelivery(updated)
      toast.push({ title: 'Sucesso', description: 'Entrega concluída.', type: 'success' })
      return
    }

    toast.push({
      title: 'Erro',
      description: useDeliveryStore.getState().error ?? 'Não foi possível concluir a entrega.',
      type: 'error',
    })
  }

  const confirmCancel = async () => {
    const updated = await cancelDelivery(id)
    if (updated) {
      setDelivery(updated)
      toast.push({ title: 'Sucesso', description: 'Entrega cancelada.', type: 'success' })
    } else {
      toast.push({
        title: 'Erro',
        description: useDeliveryStore.getState().error ?? 'Não foi possível cancelar a entrega.',
        type: 'error',
      })
    }
    setCancelOpen(false)
  }

  const handleToggleItem = async (itemId: string, delivered: boolean) => {
    const updated = delivered ? await markItemAsPending(id, itemId) : await markItemAsDelivered(id, itemId)
    if (updated) {
      setDelivery(updated)
      toast.push({
        title: 'Sucesso',
        description: delivered ? 'Item revertido para pendente.' : 'Item marcado como entregue.',
        type: 'success',
      })
      return
    }

    toast.push({
      title: 'Erro',
      description: useDeliveryStore.getState().error ?? 'Não foi possível atualizar o item.',
      type: 'error',
    })
  }

  if (loadingDelivery) {
    return <PageLoading label="Carregando entrega..." />
  }

  if (!delivery) {
    return <div className="rounded-2xl border bg-white p-6 text-slate-500">Entrega não encontrada.</div>
  }

  const deliveredCount = delivery.items.filter((item) => item.delivered).length

  return (
    <div className="space-y-6">
      <PageHeader title={`Entrega ${delivery.saleNumber}`} description="Visualização completa da entrega." />

      <DeliveryActions
        deliveryStatus={delivery.status}
        onMarkInRoute={handleMarkInRoute}
        onCompleteDelivery={confirmComplete}
        onEdit={() => router.push(`/dashboard/deliveries/${delivery.id}/edit`)}
        onCancel={() => setCancelOpen(true)}
      />

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <DeliveryGeneralCard delivery={delivery} />
        </TabsContent>

        <TabsContent value="produtos" className="space-y-4">
          <DeliveryItemsTable
            items={delivery.items}
            deliveredCount={deliveredCount}
            totalCount={delivery.items.length}
            onToggleItem={handleToggleItem}
            disabled={delivery.status === 'CANCELLED'}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={cancelOpen}
        title="Cancelar entrega"
        description="Tem certeza que deseja cancelar esta entrega? Esta ação não poderá ser desfeita."
        confirmLabel="Cancelar entrega"
        confirmTone="danger"
        onConfirm={confirmCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  )
}
