"use client"

import { Input } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui'
import { formatCurrency } from '@/lib/sales'

type Props = {
  subtotal: number
  discount: number
  shipping: number
  otherCosts: number
  total: number
  onDiscountChange: (value: number) => void
  onShippingChange: (value: number) => void
  onOtherCostsChange: (value: number) => void
}

export function SaleSummaryCard({
  subtotal,
  discount,
  shipping,
  otherCosts,
  total,
  onDiscountChange,
  onShippingChange,
  onOtherCostsChange,
}: Props) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Resumo da Venda</CardTitle>
        <p className="text-sm text-slate-500">Confira os valores antes de concluir. O estoque será baixado automaticamente ao salvar a venda.</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Desconto total</label>
              <Input type="number" min={0} step="0.01" value={discount} onChange={(e) => onDiscountChange(Number(e.target.value))} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Frete</label>
              <Input type="number" min={0} step="0.01" value={shipping} onChange={(e) => onShippingChange(Number(e.target.value))} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Outras despesas</label>
              <Input type="number" min={0} step="0.01" value={otherCosts} onChange={(e) => onOtherCostsChange(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Desconto</span>
            <span className="font-medium text-red-600">- {formatCurrency(discount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Frete</span>
            <span className="font-medium">{formatCurrency(shipping)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Outras Despesas</span>
            <span className="font-medium">{formatCurrency(otherCosts)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-base font-semibold">
          <span>Total da Venda</span>
          <span className="text-sky-700">{formatCurrency(total)}</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <div className="flex items-center gap-2 font-medium">
          <Badge variant="success">Baixa automática</Badge>
          </div>
          <p className="mt-2 text-sm">
            Ao salvar a venda, o estoque dos produtos será baixado automaticamente e poderá ser revertido em caso de cancelamento.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
