"use client"

import { Trash2 } from 'lucide-react'
import { Button, CreateButton, Input, Label, Textarea } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MAX_PURCHASE_PAYMENT_CONDITIONS } from '@/lib/purchases'

type Props = {
  paymentCondition: string[]
  onPaymentConditionChange: (index: number, value: string) => void
  onAddPaymentCondition: () => void
  onRemovePaymentCondition: (index: number) => void
  paymentMethod: string
  onPaymentMethodChange: (value: string) => void
  notes: string
  onNotesChange: (value: string) => void
}

export function PurchasePaymentCard({
  paymentCondition,
  onPaymentConditionChange,
  onAddPaymentCondition,
  onRemovePaymentCondition,
  paymentMethod,
  onPaymentMethodChange,
  notes,
  onNotesChange,
}: Props) {
  const paymentConditionRows = paymentCondition.length > 0 ? paymentCondition : ['']
  const limitReached = paymentConditionRows.length >= MAX_PURCHASE_PAYMENT_CONDITIONS

  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Pagamento e Observações</CardTitle>
        <p className="text-sm text-slate-500">
          Registre quantas condições de pagamento forem necessárias, a forma de pagamento e observações relevantes da compra.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label>Condições de Pagamento</Label>
            <span className="text-xs text-slate-500">
              {paymentConditionRows.length}/{MAX_PURCHASE_PAYMENT_CONDITIONS}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {paymentConditionRows.map((value, index) => {
              const isFirst = index === 0
              const canRemove = paymentConditionRows.length > 1

              return (
                <div key={`payment-condition-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Label className="text-xs text-slate-500">Condição {index + 1}</Label>
                    {canRemove ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemovePaymentCondition(index)}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    value={value}
                    onChange={(e) => onPaymentConditionChange(index, e.target.value)}
                    placeholder={isFirst ? 'Ex.: 30' : `Ex.: ${30 * (index + 1)}`}
                  />
                </div>
              )
            })}
          </div>

          <CreateButton
            name="Adicionar condição"
            onClick={onAddPaymentCondition}
            disabled={limitReached}
            variant="outline"
            className="w-full justify-center"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Forma de Pagamento</Label>
            <Input value={paymentMethod} onChange={(e) => onPaymentMethodChange(e.target.value)} placeholder="Ex.: Pix, boleto..." />
          </div>

          <div className="md:col-span-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={4} placeholder="Observações adicionais sobre a compra..." />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
