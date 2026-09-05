"use client"

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { BookmarkPlus, Loader2, Package } from 'lucide-react'

import { SaleCustomerAutocomplete } from '@/components/sales/add/sale-customer-autocomplete'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/components/ui'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast-provider'
import { useCustomers } from '@/hooks/customers/useCustomers'
import { reservationMessages } from '@/lib/messages/feedback'
import { buildProductLabel } from '@/lib/products'
import { InventoryService } from '@/services/inventories/inventoryService'
import { ProductReservationService } from '@/services/productReservationsService'
import { useInventoryStore } from '@/stores/inventories/useInventoryStore'
import type { Customer } from '@/types/customer'
import type { Product } from '@/types/product'
import { buildProductReservationFormSchema, type ProductReservationFormValues } from '@/validations/product-reservations/reserve-product'

type Props = {
  open: boolean
  product: Product | null
  onOpenChange: (open: boolean) => void
}

export function ProductReservationDialog({ open, product, onOpenChange }: Props) {
  const toast = useToast()
  const { customers, loadCustomers } = useCustomers()
  const loadInventory = useInventoryStore((state) => state.loadInventory)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [availableStock, setAvailableStock] = useState(0)
  const [reservedStock, setReservedStock] = useState(0)
  const [customerQuery, setCustomerQuery] = useState('')
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const formSchema = useMemo(() => buildProductReservationFormSchema(availableStock), [availableStock])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductReservationFormValues>({
    resolver: zodResolver(formSchema) as Resolver<ProductReservationFormValues>,
    defaultValues: {
      customerId: '',
      quantity: 1,
    },
  })

  useEffect(() => {
    if (!open || !product) return

    let active = true

    queueMicrotask(() => {
      if (!active) return

      setInventoryLoading(true)
      setDetailsError(null)
      setAvailableStock(0)
      setReservedStock(0)
      setCustomerQuery('')
      reset({
        customerId: '',
        quantity: 1,
      })

      loadCustomers()

      InventoryService.getByProductId(product.id)
        .then((item) => {
          if (!active) return

          if (!item) {
            setDetailsError('Este produto ainda não possui estoque cadastrado para reserva.')
            return
          }

          setAvailableStock(Number.isFinite(item.availableStock) ? item.availableStock : Math.max(0, item.currentStock - item.reservedStock))
          setReservedStock(item.reservedStock)
        })
        .catch((error) => {
          if (!active) return
          setDetailsError(error instanceof Error ? error.message : 'Não foi possível carregar os dados do estoque.')
        })
        .finally(() => {
          if (active) setInventoryLoading(false)
        })
    })

    return () => {
      active = false
    }
  }, [loadCustomers, open, product, reset])

  const productLabel = product ? buildProductLabel(product.name, product.unit, product.brand) || product.name : 'Produto'
  const selectedCustomerId = useWatch({ control, name: 'customerId' })
  const canSubmit = !saving && !inventoryLoading && !detailsError && availableStock > 0

  if (!product) return null

  const submitReservation = handleSubmit(async (values) => {
    if (!canSubmit) {
      toast.push({
        title: 'Erro',
        description: detailsError ?? 'Não há estoque disponível para reserva.',
        type: 'error',
      })
      return
    }

    setSaving(true)
    try {
      await ProductReservationService.create({
        productId: product.id,
        customerId: values.customerId,
        quantity: values.quantity,
      })

      toast.push({
        title: 'Sucesso',
        description: reservationMessages.created,
        type: 'success',
      })
      onOpenChange(false)
      void loadInventory().catch(() => {})
    } catch (error) {
      toast.push({
        title: 'Erro',
        description: error instanceof Error ? error.message : reservationMessages.error,
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reservar Produto</DialogTitle>
          <DialogDescription>Selecione um cliente e informe a quantidade que ficará reservada no estoque.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Card className="border-slate-200 bg-slate-50/80 shadow-none">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Package className="h-4 w-4 text-sky-600" />
                    {productLabel}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {product.name} · Unidade {product.unit} · Marca {product.brand}
                  </p>
                </div>
                <Badge variant={availableStock > 0 ? 'success' : 'danger'}>
                  {availableStock > 0 ? `${availableStock} disponíveis` : 'Sem disponibilidade'}
                </Badge>
              </div>

              {inventoryLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : detailsError ? (
                <p className="text-sm text-red-600">{detailsError}</p>
              ) : (
                <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <div className="rounded-xl border bg-white px-3 py-2">
                    <span className="block text-xs uppercase tracking-wide text-slate-400">Reservado atual</span>
                    <strong className="text-slate-900">{reservedStock}</strong>
                  </div>
                  <div className="rounded-xl border bg-white px-3 py-2">
                    <span className="block text-xs uppercase tracking-wide text-slate-400">Disponível</span>
                    <strong className="text-slate-900">{availableStock}</strong>
                  </div>
                  <div className="rounded-xl border bg-white px-3 py-2">
                    <span className="block text-xs uppercase tracking-wide text-slate-400">Código do produto</span>
                    <strong className="text-slate-900">{product.id}</strong>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <form className="space-y-4" onSubmit={submitReservation}>
            <SaleCustomerAutocomplete
              customers={customers}
              customerId={selectedCustomerId}
              customerQuery={customerQuery}
              onCustomerQueryChange={(value) => {
                setCustomerQuery(value)
                setValue('customerId', '', { shouldValidate: true, shouldDirty: true })
              }}
              onCustomerSelect={(customer: Customer) => {
                setCustomerQuery(customer.name)
                setValue('customerId', customer.id, { shouldValidate: true, shouldDirty: true })
              }}
              onOpenNewCustomer={() => {}}
              showCreateButton={false}
            />
            {errors.customerId && <p className="text-sm text-red-600">{errors.customerId.message}</p>}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Quantidade *</label>
              <Input
                type="number"
                min={1}
                max={Math.max(availableStock, 0)}
                step={1}
                {...register('quantity')}
                disabled={!canSubmit}
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
              <p className="mt-1 text-xs text-slate-500">Quantidade máxima disponível para reserva: {availableStock}</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookmarkPlus className="mr-2 h-4 w-4" />}
                Confirmar reserva
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
