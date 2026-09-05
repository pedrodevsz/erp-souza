"use client"

import { Button } from '@/components/ui'
import { useFormContext } from 'react-hook-form'

type Props = {
  onCancel?: () => void
  submitLabel?: string
}

export function InventoryFormActions({ onCancel, submitLabel = 'Salvar Item' }: Props) {
  const {
    reset,
    formState: { isSubmitting },
  } = useFormContext()

  return (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" onClick={onCancel ?? (() => reset())}>
        Cancelar
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </div>
  )
}
