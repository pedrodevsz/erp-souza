"use client"

import { CreateButton } from '@/components/ui'
import { SearchAutocomplete } from '@/components/shared'

type Props = {
  suppliers: string[]
  supplier: string
  supplierQuery: string
  onSupplierQueryChange: (value: string) => void
  onSupplierSelect: (value: string) => void
  onOpenNewSupplier: () => void
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function matchesSupplier(supplier: string, query: string) {
  return normalize(supplier).includes(normalize(query))
}

export function PurchaseSupplierAutocomplete({
  suppliers,
  supplier,
  supplierQuery,
  onSupplierQueryChange,
  onSupplierSelect,
  onOpenNewSupplier,
}: Props) {
  return (
    <SearchAutocomplete
      label="Fornecedor *"
      value={supplierQuery}
      onValueChange={onSupplierQueryChange}
      selectedKey={supplier || null}
      items={suppliers}
      getItemKey={(item) => item}
      getItemLabel={(item) => item}
      filterItems={(list, query) => list.filter((item) => matchesSupplier(item, query))}
      placeholder="Digite o nome do fornecedor"
      emptyMessage="Nenhum fornecedor encontrado"
      onSelect={(item) => onSupplierSelect(item)}
      rightAction={<CreateButton name="Novo Fornecedor" onClick={onOpenNewSupplier} variant="outline" className="whitespace-nowrap" />}
      renderItem={(item, isSelected) => (
        <div className={`font-medium ${isSelected ? 'text-sky-900' : 'text-slate-900'}`}>{item}</div>
      )}
    />
  )
}
