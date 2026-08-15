"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookmarkPlus, Package, Tag, Truck, ArrowLeft, Sparkles } from 'lucide-react'

import { ProductReservationDialog } from '../list/product-reservation-dialog'
import { Button, Badge } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/shared/page-loading'
import { EmptyStateAction } from '@/components/shared'
import { PageHeader } from '@/components/page-header'
import { ProductService } from '@/services/products/productService'
import { InventoryService } from '@/services/inventories/inventoryService'
import { buildProductLabel } from '@/lib/products'
import { calculateInventoryStatus, formatCurrency, statusLabel, statusTone } from '@/lib/inventories/inventory'
import type { InventoryItem } from '@/types/inventory'
import type { Product } from '@/types/product'

type Props = {
  id: string
}

function formatMargin(value?: number) {
  if (!Number.isFinite(value ?? Number.NaN)) return 'Não informado'
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value ?? 0)}%`
}

function formatStockStatus(item?: InventoryItem | null) {
  if (!item) return 'Sem estoque cadastrado'
  const stockStatus = calculateInventoryStatus(item)
  return statusLabel(stockStatus)
}

export function ProductViewPage({ id }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null)
  const [reservationOpen, setReservationOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      try {
        const [products, inventory] = await Promise.all([ProductService.getAll(), InventoryService.getByProductId(id)])
        if (!active) return

        const foundProduct = products.find((entry) => entry.id === id) ?? null
        setProduct(foundProduct)
        setInventoryItem(inventory)
      } catch {
        if (active) {
          setProduct(null)
          setInventoryItem(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [id])

  const productLabel = useMemo(() => {
    if (!product) return 'Produto'
    return buildProductLabel(product.name, product.unit, product.brand) || product.product
  }, [product])

  if (loading) {
    return <PageLoading label="Carregando produto..." />
  }

  if (!product) {
    return (
      <EmptyStateAction
        title="Produto não encontrado"
        description="Volte para a listagem e selecione outro item."
        actionLabel="Voltar"
        onAction={() => router.push('/dashboard/products')}
      />
    )
  }

  const status = inventoryItem ? calculateInventoryStatus(inventoryItem) : null

  return (
    <div className="space-y-6">
      <PageHeader title={product.product} description={productLabel} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={() => router.push('/dashboard/products')} className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={() => setReservationOpen(true)} className="w-full sm:w-auto">
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Reservar produto
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-sky-600" />
              Informações principais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Nome</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-900">{product.name}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Marca</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-900">{product.brand}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Unidade</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{product.unit}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Código</p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-900">{product.id}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Package className="h-4 w-4 text-sky-600" />
              Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">Situação</span>
              <Badge variant={status ? statusTone(status) : 'neutral'}>{formatStockStatus(inventoryItem)}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">Atual</span>
              <strong className="text-slate-900">
                {inventoryItem ? `${new Intl.NumberFormat('pt-BR').format(inventoryItem.currentStock)} ${inventoryItem.unit}` : 'Sem dados'}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">Mínimo</span>
              <strong className="text-slate-900">
                {inventoryItem ? `${new Intl.NumberFormat('pt-BR').format(inventoryItem.minimumStock)} ${inventoryItem.unit}` : 'Sem dados'}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">Reservado</span>
              <strong className="text-slate-900">
                {inventoryItem ? `${new Intl.NumberFormat('pt-BR').format(inventoryItem.reservedStock)} ${inventoryItem.unit}` : 'Sem dados'}
              </strong>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Tag className="h-4 w-4 text-sky-600" />
              Preços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Custo</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(inventoryItem?.costPrice ?? 0)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Margem</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatMargin(inventoryItem?.profitPercentage)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Venda</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(inventoryItem?.salePrice ?? product.salePrice ?? 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Truck className="h-4 w-4 text-sky-600" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              {inventoryItem?.notes?.trim() || 'Sem observações adicionais para este produto no momento.'}
            </p>
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Use a listagem para editar o produto ou reservá-lo rapidamente sem perder o contexto do estoque.
            </div>
          </CardContent>
        </Card>
      </section>

      <ProductReservationDialog
        open={reservationOpen}
        product={product}
        onOpenChange={setReservationOpen}
      />
    </div>
  )
}
