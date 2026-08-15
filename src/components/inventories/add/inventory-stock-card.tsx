"use client"

import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui'
import { calculateInventoryProfitPercentage, calculateInventorySalePrice } from '@/lib/inventories/inventory'
import { parseNumericInput } from '@/lib/number'
import type { InventoryFormValues } from '@/validations/inventory/inventory-form'

export function InventoryStockCard() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<InventoryFormValues>()
  const costPrice = watch('costPrice')
  const profitPercentage = watch('profitPercentage')
  const salePrice = watch('salePrice')
  const salePriceField = register('salePrice')
  const [salePriceManualOverride, setSalePriceManualOverride] = useState(false)

  useEffect(() => {
    if (salePriceManualOverride) return

    const nextSalePrice = calculateInventorySalePrice(costPrice ?? 0, profitPercentage ?? 0)
    if (nextSalePrice !== salePrice) {
      setValue('salePrice', nextSalePrice, { shouldDirty: false, shouldValidate: true })
    }
  }, [costPrice, profitPercentage, salePrice, salePriceManualOverride, setValue])

  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Financeiro e Estoque</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label>Preço de Custo *</Label>
          <Input type="number" step="0.01" {...register('costPrice')} />
          {errors.costPrice && <p className="mt-1 text-sm text-red-600">{errors.costPrice.message}</p>}
        </div>

        <div>
          <Label>% Lucro *</Label>
          <Input type="number" step="0.01" {...register('profitPercentage')} />
          {errors.profitPercentage && <p className="mt-1 text-sm text-red-600">{errors.profitPercentage.message}</p>}
        </div>

        <div>
          <Label>Preço de Venda *</Label>
          <Input
            type="number"
            step="0.01"
            {...salePriceField}
            onChange={(event) => {
              salePriceField.onChange(event)
              const nextSalePrice = parseNumericInput(event.target.value)
              setSalePriceManualOverride(true)
              setValue('profitPercentage', calculateInventoryProfitPercentage(costPrice ?? 0, nextSalePrice), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }}
          />
          {errors.salePrice && <p className="mt-1 text-sm text-red-600">{errors.salePrice.message}</p>}
        </div>

        <div>
          <Label>Quantidade Atual *</Label>
          <Input type="number" step="1" {...register('currentStock')} />
          {errors.currentStock && <p className="mt-1 text-sm text-red-600">{errors.currentStock.message}</p>}
        </div>

        <div>
          <Label>Estoque Mínimo *</Label>
          <Input type="number" step="1" {...register('minimumStock')} />
          {errors.minimumStock && <p className="mt-1 text-sm text-red-600">{errors.minimumStock.message}</p>}
        </div>

        <div>
          <Label>Reservado *</Label>
          <Input type="number" step="1" {...register('reservedStock')} />
          {errors.reservedStock && <p className="mt-1 text-sm text-red-600">{errors.reservedStock.message}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
