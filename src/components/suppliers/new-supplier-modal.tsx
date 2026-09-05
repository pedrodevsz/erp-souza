"use client"

import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from '@/components/ui'
import { useToast } from '@/components/ui/toast-provider'
import { supplierMessages, getFeedbackErrorMessage } from '@/lib/messages/feedback'
import type { Supplier } from '@/types/supplier'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => Promise<Supplier> | Supplier
  onCreated?: (supplier: Supplier) => Promise<void> | void
}

export function NewSupplierModal({ open, onOpenChange, onCreate, onCreated }: Props) {
  const toast = useToast()
  const [name, setName] = useState('')

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName('')
    }

    onOpenChange(nextOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.push({ title: 'Erro', description: 'Nome do fornecedor é obrigatório.', type: 'error' })
      return
    }

    try {
      const createdSupplier = await onCreate(name.trim())
      await onCreated?.(createdSupplier)
      toast.push({ title: 'Sucesso', description: supplierMessages.created, type: 'success' })
      setName('')
      handleOpenChange(false)
    } catch (error) {
      toast.push({
        title: 'Erro',
        description: getFeedbackErrorMessage(error instanceof Error ? error.message : null, supplierMessages.error),
        type: 'error',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Fornecedor</DialogTitle>
          <DialogDescription>Cadastre um fornecedor rapidamente sem sair do dashboard.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do fornecedor" autoFocus />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
