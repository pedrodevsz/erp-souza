"use client"

import { Button } from '@/components/ui'

type Props = {
  submitLabel?: string
  onCancel: () => void
  disabled?: boolean
}

export function SaleFormActions({ submitLabel = 'Salvar Venda', onCancel, disabled = false }: Props) {
  return (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={disabled}>
        {submitLabel}
      </Button>
    </div>
  )
}
