"use client"

import { SearchAutocomplete } from '@/components/shared'
import type { Product } from '@/types/product'
import { buildProductLabel } from '@/lib/products'

type Props = {
  products: Product[]
  value: string
  selectedId?: string
  onValueChange: (value: string) => void
  onSelect: (product: Product) => void
}

function matchesProduct(product: Product, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return [
    product.name,
    product.unit,
    product.brand,
    product.product,
  ].some((field) => field.toLowerCase().includes(normalized))
}

export function PurchaseProductAutocomplete({ products, value, selectedId, onValueChange, onSelect }: Props) {
  return (
    <SearchAutocomplete
      label="Buscar produto *"
      value={value}
      onValueChange={onValueChange}
      selectedKey={selectedId ?? null}
      items={products}
      getItemKey={(item) => item.id}
      getItemLabel={(item) => item.product}
      filterItems={(list, query) => list.filter((product) => matchesProduct(product, query))}
      placeholder="Digite nome, marca, unidade ou parte do produto"
      emptyMessage="Nenhum produto encontrado"
      onSelect={onSelect}
      renderItem={(product, isSelected) => (
        <div>
          <div className={`font-medium ${isSelected ? 'text-sky-900' : 'text-slate-900'}`}>{product.product}</div>
          <div className="mt-1 text-xs text-slate-500">
            {buildProductLabel(product.name, product.unit, product.brand)}
          </div>
        </div>
      )}
    />
  )
}
