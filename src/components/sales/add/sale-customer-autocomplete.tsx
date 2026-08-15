"use client"

import { CreateButton } from '@/components/ui'
import { SearchAutocomplete } from '@/components/shared'
import type { Customer } from '@/types/customer'

type Props = {
  customers: Customer[]
  customerId: string
  customerQuery: string
  onCustomerQueryChange: (value: string) => void
  onCustomerSelect: (customer: Customer) => void
  onOpenNewCustomer: () => void
  showCreateButton?: boolean
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function matchesCustomer(customer: Customer, query: string) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return true

  const document = customer.document.replace(/\D/g, '')
  const phone = customer.phone.replace(/\D/g, '')
  const digits = normalizedQuery.replace(/\D/g, '')

  return (
    customer.name.toLowerCase().includes(normalizedQuery) ||
    customer.document.toLowerCase().includes(normalizedQuery) ||
    (digits.length > 0 && document.includes(digits)) ||
    customer.phone.toLowerCase().includes(normalizedQuery) ||
    (digits.length > 0 && phone.includes(digits))
  )
}

export function SaleCustomerAutocomplete({
  customers,
  customerId,
  customerQuery,
  onCustomerQueryChange,
  onCustomerSelect,
  onOpenNewCustomer,
  showCreateButton = true,
}: Props) {
  return (
    <SearchAutocomplete
      label="Cliente *"
      value={customerQuery}
      onValueChange={onCustomerQueryChange}
      selectedKey={customerId}
      items={customers}
      getItemKey={(customer) => customer.id}
      getItemLabel={(customer) => customer.name}
      filterItems={(list, query) => list.filter((customer) => matchesCustomer(customer, query))}
      placeholder="Digite nome, CPF/CNPJ ou telefone"
      emptyMessage="Nenhum cliente encontrado"
      onSelect={onCustomerSelect}
      rightAction={
        showCreateButton ? <CreateButton name="Novo Cliente" onClick={onOpenNewCustomer} variant="outline" className="whitespace-nowrap" /> : undefined
      }
      renderItem={(customer, isSelected) => (
        <>
          <div className={`font-medium ${isSelected ? 'text-sky-900' : 'text-slate-900'}`}>{customer.name}</div>
          <div className="mt-1 text-xs text-slate-500">
            {customer.document}
            {customer.phone ? ` • ${customer.phone}` : ''}
          </div>
        </>
      )}
    />
  )
}
