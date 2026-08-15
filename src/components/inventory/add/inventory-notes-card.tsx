"use client"

import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui'
import type { InventoryFormValues } from '@/validations/inventory/inventory-form'

export function InventoryNotesCard() {
  const {
    register,
    formState: { errors },
  } = useFormContext<InventoryFormValues>()

  return (
    <Card>
      <CardHeader className="mb-2">
        <CardTitle className="text-sm font-semibold text-sky-600">Observações</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea {...register('notes')} rows={4} placeholder="Observações adicionais sobre o item..." />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
      </CardContent>
    </Card>
  )
}
