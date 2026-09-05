"use client"

import { AlertDialog } from '@/components/ui'

type Props = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ProductsDeleteDialog({ open, onCancel, onConfirm }: Props) {
  return (
    <AlertDialog
      open={open}
      title="Excluir produto"
      description="Tem certeza que deseja excluir este produto? Esta ação não poderá ser desfeita."
      confirmLabel="Excluir"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
