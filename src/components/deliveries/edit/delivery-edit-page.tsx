"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { PageLoading } from '@/components/shared/page-loading'
import { Badge, Button, Input, Textarea } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-provider'
import { useDeliveries } from '@/hooks/deliveries/useDeliveries'
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_VARIANTS, formatDate } from '@/lib/deliveries'
import { useDeliveryStore } from '@/stores/useDeliveryStore'
import type { Delivery } from '@/types/delivery'

type Props = {
  id: string
}

type FormState = {
  scheduledDate: string
  driverName: string
  notes: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
}

export function DeliveryEditPage({ id }: Props) {
  const router = useRouter()
  const toast = useToast()
  const { hydrated, findDeliveryById, updateDelivery } = useDeliveries()
  const [loadingDelivery, setLoadingDelivery] = useState(true)
  const [saving, setSaving] = useState(false)
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [form, setForm] = useState<FormState | null>(null)

  useEffect(() => {
    if (!hydrated) return

    let active = true
    async function load() {
      setLoadingDelivery(true)
      const found = await findDeliveryById(id)
      if (!active) return
      setDelivery(found)
      if (found) {
        setForm({
          scheduledDate: found.scheduledDate.slice(0, 10),
          driverName: found.driverName ?? '',
          notes: found.notes ?? '',
          street: found.address.street,
          number: found.address.number,
          complement: found.address.complement ?? '',
          district: found.address.district,
          city: found.address.city,
          state: found.address.state,
        })
      }
      setLoadingDelivery(false)
    }

    load()

    return () => {
      active = false
    }
  }, [findDeliveryById, hydrated, id])

  const handleSubmit = async () => {
    if (!delivery || !form) return
    setSaving(true)
    const updated = await updateDelivery(id, {
      scheduledDate: new Date(form.scheduledDate).toISOString(),
      driverName: form.driverName,
      notes: form.notes,
      address: {
        street: form.street,
        number: form.number,
        complement: form.complement,
        district: form.district,
        city: form.city,
        state: form.state,
      },
    })
    setSaving(false)

    if (updated) {
      toast.push({ title: 'Sucesso', description: 'Entrega atualizada.', type: 'success' })
      router.push(`/dashboard/deliveries/${id}`)
      return
    }

    toast.push({
      title: 'Erro',
      description: useDeliveryStore.getState().error ?? 'Não foi possível salvar a entrega.',
      type: 'error',
    })
  }

  if (loadingDelivery) {
    return <PageLoading label="Carregando entrega..." />
  }

  if (!delivery || !form) {
    return <div className="rounded-2xl border bg-white p-6 text-slate-500">Entrega não encontrada.</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Editar ${delivery.saleNumber}`} description="Atualize os dados operacionais da entrega." />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Resumo da Entrega</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Venda {delivery.saleNumber || delivery.saleId} - {delivery.customerName}</p>
          </div>
          <Badge variant={DELIVERY_STATUS_VARIANTS[delivery.status]}>{DELIVERY_STATUS_LABELS[delivery.status]}</Badge>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Data agendada</label>
              <Input type="date" value={form.scheduledDate} onChange={(event) => setForm((state) => state && { ...state, scheduledDate: event.target.value })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Motorista</label>
              <Input value={form.driverName} onChange={(event) => setForm((state) => state && { ...state, driverName: event.target.value })} placeholder="Nome do motorista" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Observações</label>
              <Textarea value={form.notes} onChange={(event) => setForm((state) => state && { ...state, notes: event.target.value })} placeholder="Anotações da entrega" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Rua</label>
              <Input value={form.street} onChange={(event) => setForm((state) => state && { ...state, street: event.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Número</label>
                <Input value={form.number} onChange={(event) => setForm((state) => state && { ...state, number: event.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Complemento</label>
                <Input value={form.complement} onChange={(event) => setForm((state) => state && { ...state, complement: event.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Bairro</label>
              <Input value={form.district} onChange={(event) => setForm((state) => state && { ...state, district: event.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Cidade</label>
                <Input value={form.city} onChange={(event) => setForm((state) => state && { ...state, city: event.target.value })} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Estado</label>
                <Input value={form.state} onChange={(event) => setForm((state) => state && { ...state, state: event.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
        <div className="text-sm text-slate-600">
          Data atualizada localmente: <span className="font-medium text-slate-900">{formatDate(delivery.updatedAt)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </div>
  )
}
