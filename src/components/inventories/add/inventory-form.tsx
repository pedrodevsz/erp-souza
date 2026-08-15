"use client"

import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import type { InventoryItem, NewInventoryItem } from '@/types/inventory'
import { inventoryFormSchema, type InventoryFormValues } from '@/validations/inventory/inventory-form'
import { InventoryFormActions } from './inventory-form-actions'
import { InventoryNotesCard } from './inventory-notes-card'
import { InventoryProductCard } from './inventory-product-card'
import { InventoryStockCard } from './inventory-stock-card'
import { buildInventoryFormValues, buildInventoryPayload } from '@/lib/inventories/inventory'

type Props = {
  initialValues?: Partial<InventoryFormValues> | InventoryItem | null
  onSubmit?: (data: NewInventoryItem) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
}

export function InventoryForm({ initialValues, onSubmit, onCancel, submitLabel }: Props) {
  const router = useRouter()
  const normalized = buildInventoryFormValues(initialValues)

  const methods = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema as never),
    defaultValues: {
      ...normalized,
    },
  })

  const handleSubmit = async (values: InventoryFormValues) => {
    const payload = buildInventoryPayload(values)
    if (onSubmit) {
      await onSubmit(payload)
    } else {
      console.log(payload)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
      return
    }

    router.back()
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <InventoryProductCard />
          <InventoryStockCard />
          <InventoryNotesCard />
          <div className="rounded-2xl border bg-white p-4">
            <InventoryFormActions onCancel={handleCancel} submitLabel={submitLabel} />
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
