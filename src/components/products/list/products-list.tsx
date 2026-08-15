"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookmarkPlus, ChevronDown, ChevronUp, Eye, MoreHorizontal, PencilLine, Search, Trash2 } from 'lucide-react'
import { Button, Input, AlertDialog, Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { EmptyStateAction } from '@/components/shared'
import { PageLoading } from '@/components/shared/page-loading'
import { ProductsSummaryCards } from './products-summary-cards'
import { ProductReservationDialog } from './product-reservation-dialog'
import { ProductService } from '@/services/products/productService'
import { InventoryService } from '@/services/inventories/inventoryService'
import { buildProductLabel, normalizeProductInput } from '@/lib/products'
import { formatCurrency } from '@/lib/inventories/inventory'
import { productMessages } from '@/lib/messages/feedback'
import { calculateInventoryStatus, statusLabel, statusTone } from '@/lib/inventories/inventory'
import type { InventoryItem } from '@/types/inventory'
import type { Product } from '@/types/product'

type FormState = {
  name: string
  unit: string
  brand: string
}

const EMPTY_FORM: FormState = {
  name: '',
  unit: '',
  brand: '',
}

function ProductFormDialog({
  open,
  title,
  initialValues,
  onCancel,
  onSubmit,
}: {
  open: boolean
  title: string
  initialValues?: FormState
  onCancel: () => void
  onSubmit: (values: FormState) => Promise<void> | void
}) {
  const [form, setForm] = useState<FormState>(initialValues ?? EMPTY_FORM)

  useEffect(() => {
    if (!open) return

    let active = true
    queueMicrotask(() => {
      if (active) {
        setForm(initialValues ?? EMPTY_FORM)
      }
    })

    return () => {
      active = false
    }
  }, [initialValues, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onCancel} aria-label="Fechar modal" />
      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Nome do Produto</label>
            <Input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Ex.: Cimento" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Unidade</label>
            <Input value={form.unit} onChange={(e) => setForm((current) => ({ ...current, unit: e.target.value }))} placeholder="Ex.: SC" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Marca</label>
            <Input value={form.brand} onChange={(e) => setForm((current) => ({ ...current, brand: e.target.value }))} placeholder="Ex.: Votoran" />
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Produto final: <strong className="text-slate-900">{buildProductLabel(form.name, form.unit, form.brand) || 'Não informado'}</strong>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="button" onClick={() => onSubmit(form)} className="w-full sm:w-auto">
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProductStockBadge({ item }: { item?: InventoryItem }) {
  if (!item) {
    return <Badge variant="neutral">Sem estoque</Badge>
  }

  const stockStatus = calculateInventoryStatus(item)
  return <Badge variant={statusTone(stockStatus)}>{statusLabel(stockStatus)}</Badge>
}

function formatStockValue(item?: InventoryItem) {
  if (!item) return 'Sem estoque cadastrado'
  return `${new Intl.NumberFormat('pt-BR').format(item.currentStock)} ${item.unit}`
}

function formatMargin(item?: InventoryItem) {
  if (!item) return 'Não informado'
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(item.profitPercentage)}%`
}

function ProductMobileCard({
  product,
  inventoryItem,
  onEdit,
  onDelete,
  onReserve,
}: {
  product: Product
  inventoryItem?: InventoryItem
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onReserve: (product: Product) => void
}) {
  const productLabel = buildProductLabel(product.name, product.unit, product.brand) || product.product
  const salePrice = inventoryItem?.salePrice ?? product.salePrice ?? 0

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="space-y-2 border-b border-slate-100 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="line-clamp-2 text-base font-semibold text-slate-900">{product.product}</CardTitle>
            <p className="mt-1 text-sm text-slate-500">{productLabel}</p>
          </div>
          <ProductStockBadge item={inventoryItem} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Estoque</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatStockValue(inventoryItem)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Preço de venda</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(salePrice)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Custo</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(inventoryItem?.costPrice ?? 0)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Margem</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatMargin(inventoryItem)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/dashboard/products/${product.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver produto
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-center">
                <MoreHorizontal className="h-4 w-4" />
                Mais ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <PencilLine className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReserve(product)}>
                <BookmarkPlus className="h-4 w-4" />
                Reservar Produto
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(product.id)}>
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductsList() {
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [reservationOpen, setReservationOpen] = useState(false)
  const [reservationProduct, setReservationProduct] = useState<Product | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      try {
        const [productsResult, inventoryResult] = await Promise.allSettled([ProductService.getAll(), InventoryService.getAll()])

        if (!active) return

        if (productsResult.status === 'fulfilled') {
          setProducts(productsResult.value)
        } else {
          toast.push({
            title: 'Erro',
            description: productsResult.reason instanceof Error ? productsResult.reason.message : productMessages.error,
            type: 'error',
          })
        }

        if (inventoryResult.status === 'fulfilled') {
          setInventoryItems(inventoryResult.value)
        } else {
          setInventoryItems([])
          toast.push({
            title: 'Erro',
            description: inventoryResult.reason instanceof Error ? inventoryResult.reason.message : 'Não foi possível carregar o estoque.',
            type: 'error',
          })
        }
      } catch (error) {
        toast.push({
          title: 'Erro',
          description: error instanceof Error ? error.message : productMessages.error,
          type: 'error',
        })
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [toast])

  const inventoryByProductId = useMemo(() => {
    const map = new Map<string, InventoryItem>()
    inventoryItems.forEach((item) => {
      if (item.productId?.trim()) {
        map.set(item.productId.trim(), item)
      }
    })
    return map
  }, [inventoryItems])

  const inventoryByLabel = useMemo(() => {
    const map = new Map<string, InventoryItem>()
    inventoryItems.forEach((item) => {
      const label = buildProductLabel(item.productName, item.unit, item.brand).toLowerCase()
      if (label) {
        map.set(label, item)
      }
    })
    return map
  }, [inventoryItems])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((product) =>
      [product.name, product.unit, product.brand, product.product].some((field) => field.toLowerCase().includes(q))
    )
  }, [products, search])

  const visibleProducts = filtered.slice(0, 5)
  const remainingProducts = filtered.slice(5)
  const hasMoreProducts = filtered.length > 5

  const summary = useMemo(
    () => ({
      total: products.length,
      brands: new Set(products.map((product) => product.brand)).size,
      reserved: inventoryItems.reduce((sum, item) => sum + (Number.isFinite(item.reservedStock) ? item.reservedStock : 0), 0),
    }),
    [inventoryItems, products]
  )

  const resolveInventoryItem = (product: Product) =>
    inventoryByProductId.get(product.id) ??
    inventoryByLabel.get(buildProductLabel(product.name, product.unit, product.brand).toLowerCase()) ??
    inventoryItems.find((item) => buildProductLabel(item.productName, item.unit, item.brand).toLowerCase() === buildProductLabel(product.name, product.unit, product.brand).toLowerCase())

  if (loading) {
    return <PageLoading />
  }

  const handleSubmit = async (values: FormState) => {
    if (!editing) return

    const normalized = normalizeProductInput(values)

    try {
      const updated = await ProductService.update(editing.id, normalized)
      setProducts((current) => current.map((product) => (product.id === updated.id ? updated : product)))
      toast.push({ title: 'Sucesso', description: productMessages.updated, type: 'success' })
      setDialogOpen(false)
      setEditing(null)
    } catch (error) {
      toast.push({
        title: 'Erro',
        description: error instanceof Error ? error.message : productMessages.error,
        type: 'error',
      })
    }
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setDialogOpen(true)
  }

  const openReservation = (product: Product) => {
    setReservationProduct(product)
    setReservationOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await ProductService.delete(deleteId)
      setProducts((current) => current.filter((product) => product.id !== deleteId))
      toast.push({ title: 'Sucesso', description: productMessages.deleted, type: 'success' })
    } catch (error) {
      toast.push({
        title: 'Erro',
        description: error instanceof Error ? error.message : productMessages.error,
        type: 'error',
      })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Catálogo central de produtos alimentado pelas compras e usado por estoque e vendas."
      />

      <ProductsSummaryCards
        totalProducts={summary.total}
        totalBrands={summary.brands}
        totalReserved={summary.reserved}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">Gerenciamento</CardTitle>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, unidade ou marca"
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="space-y-4 md:hidden">
            {filtered.length === 0 ? (
              <EmptyStateAction
                title={search.trim() ? 'Nenhum produto encontrado' : 'Sem produtos'}
                description={search.trim() ? `Nenhum resultado para “${search.trim()}”.` : 'Inclua uma compra primeiro.'}
                actionLabel="Nova Compra"
                href="/dashboard/purchases/new"
              />
            ) : (
              <>
                {visibleProducts.map((product) => (
                  <ProductMobileCard
                    key={product.id}
                    product={product}
                    inventoryItem={resolveInventoryItem(product)}
                    onEdit={openEdit}
                    onDelete={setDeleteId}
                    onReserve={openReservation}
                  />
                ))}

                {showAllProducts &&
                  remainingProducts.map((product) => (
                    <ProductMobileCard
                      key={product.id}
                      product={product}
                      inventoryItem={resolveInventoryItem(product)}
                      onEdit={openEdit}
                      onDelete={setDeleteId}
                      onReserve={openReservation}
                    />
                  ))}

                {hasMoreProducts && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAllProducts((current) => !current)}
                      className="w-full justify-center gap-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      {showAllProducts ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          Ver mais
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden overflow-auto md:block">
            <table className="min-w-[960px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Marca</th>
                  <th className="px-4 py-3">Preço de Venda</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      <EmptyStateAction
                        title={search.trim() ? 'Nenhum produto encontrado' : 'Sem produtos'}
                        description={search.trim() ? `Nenhum resultado para “${search.trim()}”.` : 'Inclua uma compra primeiro.'}
                        actionLabel="Nova Compra"
                        href="/dashboard/purchases/new"
                      />
                    </td>
                  </tr>
                ) : (
                  <>
                    {visibleProducts.map((product) => (
                      <tr key={product.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 align-top font-medium text-slate-900">{product.product}</td>
                        <td className="px-4 py-3 align-top">{product.name}</td>
                        <td className="px-4 py-3 align-top whitespace-nowrap">{product.unit}</td>
                        <td className="px-4 py-3 align-top">{product.brand}</td>
                        <td className="px-4 py-3 align-top whitespace-nowrap">{formatCurrency(resolveInventoryItem(product)?.salePrice ?? product.salePrice ?? 0)}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/dashboard/products/${product.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </Link>
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => openEdit(product)}>
                              <PencilLine className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => openReservation(product)}>
                              <BookmarkPlus className="mr-2 h-4 w-4" />
                              Reservar
                            </Button>
                            <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteId(product.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {showAllProducts &&
                      remainingProducts.map((product) => (
                        <tr key={product.id} className="border-b border-slate-100">
                          <td className="px-4 py-3 align-top font-medium text-slate-900">{product.product}</td>
                          <td className="px-4 py-3 align-top">{product.name}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap">{product.unit}</td>
                          <td className="px-4 py-3 align-top">{product.brand}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap">{formatCurrency(resolveInventoryItem(product)?.salePrice ?? product.salePrice ?? 0)}</td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-wrap gap-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/dashboard/products/${product.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </Link>
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => openEdit(product)}>
                                <PencilLine className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => openReservation(product)}>
                                <BookmarkPlus className="mr-2 h-4 w-4" />
                                Reservar
                              </Button>
                              <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteId(product.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                    {hasMoreProducts && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4">
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setShowAllProducts((current) => !current)}
                              className="inline-flex items-center gap-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                              {showAllProducts ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5" />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5" />
                                  Ver mais
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        title="Editar produto"
        initialValues={editing ? { name: editing.name, unit: editing.unit, brand: editing.brand } : undefined}
        onCancel={() => {
          setDialogOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(deleteId)}
        title="Excluir produto"
        description="Tem certeza que deseja excluir este produto? Esta ação não poderá ser desfeita."
        confirmLabel="Excluir"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      <ProductReservationDialog
        open={reservationOpen}
        product={reservationProduct}
        onOpenChange={(open) => {
          setReservationOpen(open)
          if (!open) {
            setReservationProduct(null)
          }
        }}
      />
    </div>
  )
}
