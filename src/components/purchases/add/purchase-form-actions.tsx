"use client"

import { Button } from '@/components/ui'

type Props = {
  disabled?: boolean
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
}

export function PurchaseFormActions({
  disabled = false,
  submitLabel = 'Salvar Compra',
  cancelLabel = 'Cancelar',
  onCancel,
}: Props) {
  return (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button type="submit" disabled={disabled}>
        {submitLabel}
      </Button>
    </div>
  )
}
