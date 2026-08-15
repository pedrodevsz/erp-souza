"use client"

import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, CircleHelp, Search } from 'lucide-react'
import { Button, Label, Input, CreateButton } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/shared/page-loading'
import { cn } from '@/lib/utils'
import { getPurchaseCategoryChipClassName, getPurchaseCategoryLabel, getPurchaseUnitChipClassName, getPurchaseUnitLabel } from '@/lib/purchases'
import { PurchaseProductAutocomplete } from './purchase-product-autocomplete'
import type { Product } from '@/types/product'
import { PURCHASE_CATEGORIES, PURCHASE_UNITS, type PurchaseItemDraft } from './purchase-form.types'
import { parseNumericInput } from '@/lib/number'
import { Collapsible, CollapsibleContent } from '@/components/ui'

type Props = {
  items: PurchaseItemDraft[]
  products: Product[]
  onAddItem: () => void
  onRemoveItem: () => void
  expandedItemIndex: number | null
  onExpandedItemChange: (index: number | null) => void
  onProductQueryChange: (index: number, value: string) => void
  onProductSelect: (index: number, product: Product) => void
  onProductNameChange: (index: number, value: string) => void
  onBrandChange: (index: number, value: string) => void
  onCategoryChange: (index: number, value: string) => void
  onQuantityChange: (index: number, value: number) => void
  onUnitChange: (index: number, value: string) => void
  onUnitPriceChange: (index: number, value: number) => void
  onProfitPercentageChange: (index: number, value: number) => void
  onSalePriceChange: (index: number, value: number) => void
  loading?: boolean
}

function PurchaseUnitPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex w-full flex-nowrap gap-1.5 overflow-hidden">
      {PURCHASE_UNITS.map((unit) => {
        const selected = value === unit

        return (
          <button
            key={unit}
            type="button"
            onClick={() => onChange(unit)}
            aria-pressed={selected}
            className={cn(
              'flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg border px-2 py-1 text-[11px] font-semibold leading-none transition-all duration-200 sm:h-9 sm:text-xs',
              getPurchaseUnitChipClassName(unit, selected)
            )}
          >
            <span>{getPurchaseUnitLabel(unit)}</span>
          </button>
        )
      })}
    </div>
  )
}

function PurchaseCategoryPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex w-full flex-nowrap gap-1.5 overflow-hidden">
      {PURCHASE_CATEGORIES.map((category) => {
        const selected = value === category

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            aria-pressed={selected}
            className={cn(
              'flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg border px-2 py-1 text-[11px] font-semibold leading-none transition-all duration-200 sm:h-9 sm:text-xs',
              getPurchaseCategoryChipClassName(category, selected)
            )}
          >
            <span>{getPurchaseCategoryLabel(category)}</span>
          </button>
        )
      })}
    </div>
  )
}

function getMatchStatusMeta(status?: PurchaseItemDraft['matchStatus']) {
  switch (status) {
    case 'exact':
      return {
        label: 'Produto identificado',
        icon: CheckCircle2,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      }
    case 'similar':
      return {
        label: 'Produto semelhante encontrado',
        icon: Search,
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      }
    case 'multiple_matches':
      return {
        label: 'Mais de uma opção encontrada',
        icon: CircleHelp,
        className: 'border-sky-200 bg-sky-50 text-sky-700',
      }
    case 'not_found':
      return {
        label: 'Produto não encontrado',
        icon: AlertTriangle,
        className: 'border-rose-200 bg-rose-50 text-rose-700',
      }
    default:
      return null
  }
}

export function PurchaseItemsCard({
  items,
  products,
  onAddItem,
  onRemoveItem,
  expandedItemIndex,
  onExpandedItemChange,
  onProductQueryChange,
  onProductSelect,
  onProductNameChange,
  onBrandChange,
  onCategoryChange,
  onQuantityChange,
  onUnitChange,
  onUnitPriceChange,
  onProfitPercentageChange,
  onSalePriceChange,
  loading = false,
}: Props) {
  function buildItemSummary(item: PurchaseItemDraft, index: number) {
    const hasProduct = Boolean(item.productName?.trim())
    return hasProduct
      ? `${index + 1}. ${item.productName}${item.brand?.trim() ? ` • ${item.brand.trim()}` : ''} • ${item.quantity} ${item.unit}`
      : `Produto ${index + 1}`
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Produtos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => {
          const statusMeta = getMatchStatusMeta(item.matchStatus)

          return (
            <Collapsible
              key={index}
              open={expandedItemIndex === index}
              onOpenChange={(open) => onExpandedItemChange(open ? index : null)}
              className={cn(
                'rounded-2xl border bg-slate-50',
                item.matchStatus === 'not_found' || item.matchStatus === 'multiple_matches'
                  ? 'border-rose-200'
                  : item.matchStatus === 'similar'
                    ? 'border-amber-200'
                    : 'border-slate-200'
              )}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Produto {index + 1}</div>
                  <div className="truncate text-sm font-semibold text-slate-900">{buildItemSummary(item, index)}</div>
                  {statusMeta ? (
                    <div className={cn('mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', statusMeta.className)}>
                      <statusMeta.icon className="h-3.5 w-3.5" />
                      {statusMeta.label}
                      {typeof item.matchConfidence === 'number' ? (
                        <span className="font-medium opacity-70">{Math.round(item.matchConfidence * 100)}%</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onExpandedItemChange(expandedItemIndex === index ? null : index)}
                    className="text-slate-600 hover:bg-slate-100"
                  >
                    {expandedItemIndex === index ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                    {expandedItemIndex === index ? 'Fechar' : 'Abrir'}
                  </Button>
                </div>
              </div>

              <CollapsibleContent>
                <div className="space-y-4 p-4">
                  <PurchaseProductAutocomplete
                    products={products}
                    value={item.productSearch ?? item.sourceDescription ?? item.productName ?? ''}
                    selectedId={item.productId}
                    onValueChange={(value) => onProductQueryChange(index, value)}
                    onSelect={(product) => onProductSelect(index, product)}
                  />

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label>Nome do Produto</Label>
                      <Input
                        value={item.productName ?? ''}
                        onChange={(e) => onProductNameChange(index, e.target.value)}
                        placeholder="Ex.: Cimento"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <Label>Marca</Label>
                        <Input
                          value={item.brand ?? ''}
                          onChange={(e) => onBrandChange(index, e.target.value)}
                          placeholder="Ex.: Votoran"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2">
                        <Label>Unidade</Label>
                        <PurchaseUnitPicker value={item.unit} onChange={(unit) => onUnitChange(index, unit)} />
                      </div>

                      <div className="space-y-2">
                        <Label>Categoria</Label>
                        <PurchaseCategoryPicker value={item.category} onChange={(value) => onCategoryChange(index, value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div>
                        <Label>Qtd</Label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) => onQuantityChange(index, parseNumericInput(e.target.value))}
                        />
                      </div>

                      <div>
                        <Label>Preço Un</Label>
                        <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => onUnitPriceChange(index, parseNumericInput(e.target.value))} />
                      </div>

                      <div>
                        <Label>% Lucro</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.profitPercentage}
                          onChange={(e) => onProfitPercentageChange(index, parseNumericInput(e.target.value))}
                        />
                      </div>

                      <div>
                        <Label>Preço Ven</Label>
                        <Input type="number" step="0.01" value={item.salePrice} onChange={(e) => onSalePriceChange(index, parseNumericInput(e.target.value))} />
                      </div>
                    </div>
                    <div>
                      <Label>Subtotal</Label>
                      <div className="py-2 text-sm">R$ {item.subtotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
              </Collapsible>
          )
        })}

        <div className="flex gap-2 pt-2">
          <CreateButton name="Adicionar Produto" onClick={onAddItem} disabled={loading} />
          <Button type="button" variant="destructive" onClick={onRemoveItem} disabled={items.length === 0 || loading}>
            - Remover Produto
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
