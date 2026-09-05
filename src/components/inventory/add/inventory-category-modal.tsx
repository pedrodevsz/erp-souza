"use client"

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Input, Label } from '@/components/ui'
import { useToast } from '@/components/ui/toast-provider'

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export function InventoryCategoryModal({ open, onClose, onCreate }: Props) {
  const toast = useToast()
  const [name, setName] = useState('')

  if (!open || typeof document === 'undefined') return null

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!name.trim()) {
      toast.push({ title: 'Erro', description: 'Nome da categoria é obrigatório', type: 'error' })
      return
    }

    onCreate(name.trim())
    toast.push({ title: 'Sucesso', description: 'Categoria criada', type: 'success' })
    setName('')
    onClose()
  }

  return (
    createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="z-10 w-full max-w-md rounded-md bg-white p-6 shadow-lg">
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold">Nova Categoria</h3>
            <div className="mt-4">
              <Label>Nome</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da categoria" />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )
  )
}

export default InventoryCategoryModal
