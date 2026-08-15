"use client"

import { useEffect } from 'react'
import { CustomerForm } from './customer-form'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui'
import { useToast } from '@/components/ui/toast-provider'
import { useCustomerStore } from '@/stores/customers/useCustomerStore'
import type { Customer, NewCustomer } from '@/types/customer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerCreated?: (customer: Customer) => void
}

export function CustomerCreateDialog({ open, onOpenChange, onCustomerCreated }: Props) {
  const toast = useToast()
  const loadCustomers = useCustomerStore((state) => state.loadCustomers)
  const createCustomer = useCustomerStore((state) => state.createCustomer)
  const selectCustomer = useCustomerStore((state) => state.selectCustomer)

  useEffect(() => {
    if (open) {
      void loadCustomers()
    }
  }, [loadCustomers, open])

  const handleSubmit = async (payload: NewCustomer) => {
    const created = await createCustomer(payload)
    if (!created) return

    selectCustomer(created.id)
    onCustomerCreated?.(created)
    toast.push({
      title: 'Cliente criado',
      description: `${created.name} foi salvo com sucesso.`,
      type: 'success',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>Cadastre um cliente sem sair do dashboard.</DialogDescription>
        </DialogHeader>
        <CustomerForm inline onSubmit={handleSubmit} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
