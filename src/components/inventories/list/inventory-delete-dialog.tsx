"use client"

import { AlertDialog } from '@/components/ui'

type Props = {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function InventoryDeleteDialog({ open, onCancel, onConfirm }: Props) {
  return (
    <AlertDialog
      open={open}
      title="Excluir item do estoque"
      description="Tem certeza que deseja excluir este item do estoque? Esta ação não poderá ser desfeita."
      confirmLabel="Excluir"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}

