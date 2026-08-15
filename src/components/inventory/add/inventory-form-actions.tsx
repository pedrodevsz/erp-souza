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
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onCancel ?? (() => reset())} className="w-full sm:w-auto">
        Cancelar
      </Button>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </div>
  )
}
