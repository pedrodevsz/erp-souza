"use client"

import { Badge, Input, Select } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SALE_PAYMENT_METHODS, formatCurrency, isImmediateSalePaymentCondition } from '@/lib/sales'

type Props = {
  paymentConditionType: string
  paymentMethod: string
  onPaymentMethodChange: (value: string) => void
  initialPayment: number
  onInitialPaymentChange: (value: number) => void
  total: number
  remainingAfterInitial: number
}

export function SalePaymentCard({
  paymentConditionType,
  paymentMethod,
  onPaymentMethodChange,
  initialPayment,
  onInitialPaymentChange,
  total,
  remainingAfterInitial,
}: Props) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Pagamento</CardTitle>
        <p className="text-sm text-slate-500">Registre o valor pago agora e deixe o restante em aberto, sem parcelas fixas.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!paymentConditionType && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Selecione a condição de pagamento para liberar os campos.
          </div>
        )}

        {isImmediateSalePaymentCondition(paymentConditionType) ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Forma de Pagamento *</label>
              <Select value={paymentMethod} onChange={(e) => onPaymentMethodChange(e.target.value)}>
                <option value="">Selecione a forma de pagamento</option>
                {SALE_PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Pagamento à vista fecha a venda no valor total de {formatCurrency(total)}.
            </div>
          </>
        ) : paymentConditionType ? (
          <>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Não há divisão automática. Registre apenas o valor da primeira parcela.
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Valor da primeira parcela *</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={initialPayment}
                onChange={(e) => onInitialPaymentChange(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-slate-900">Saldo restante</div>
                <div className="text-slate-500">{formatCurrency(remainingAfterInitial)}</div>
              </div>
              <Badge variant={remainingAfterInitial <= 0 ? 'success' : initialPayment <= 0 ? 'neutral' : 'warning'}>
                {remainingAfterInitial <= 0 ? 'Pago' : initialPayment <= 0 ? 'Sem pagamento' : 'Pagamento parcial'}
              </Badge>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
