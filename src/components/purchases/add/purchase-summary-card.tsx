"use client"

import { Input } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui'
import { formatCurrency } from '@/lib/sales'
import { parseNumericInput } from '@/lib/number'

type Props = {
  subtotal: number
  discounts: number
  freight: number
  otherExpenses: number
  total: number
  onDiscountsChange: (value: number) => void
  onFreightChange: (value: number) => void
  onOtherExpensesChange: (value: number) => void
}

export function PurchaseSummaryCard({
  subtotal,
  discounts,
  freight,
  otherExpenses,
  total,
  onDiscountsChange,
  onFreightChange,
  onOtherExpensesChange,
}: Props) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Resumo da Compra</CardTitle>
        <p className="text-sm text-slate-500">Revise os valores financeiros antes de salvar a compra.</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Descontos</label>
            <Input type="number" min={0} step="0.01" value={discounts} onChange={(e) => onDiscountsChange(parseNumericInput(e.target.value))} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Frete</label>
            <Input type="number" min={0} step="0.01" value={freight} onChange={(e) => onFreightChange(parseNumericInput(e.target.value))} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Outras despesas</label>
            <Input type="number" min={0} step="0.01" value={otherExpenses} onChange={(e) => onOtherExpensesChange(parseNumericInput(e.target.value))} />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Descontos</span>
            <span className="font-medium text-red-600">- {formatCurrency(discounts)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frete</span>
            <span className="font-medium">{formatCurrency(freight)}</span>
          </div>
          <div className="flex justify-between">
            <span>Outras despesas</span>
            <span className="font-medium">{formatCurrency(otherExpenses)}</span>
          </div>
        </div>

        <Separator />

        <div className="mt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-sky-700">{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
