"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui'
import { DefinitionList } from '@/components/shared'
import { RegisterPaymentForm } from './register-payment-form'
import {
  getSaleDeliveryFlagLabel,
  getSaleDeliveryFlagVariant,
  SALE_DELIVERY_STATUS_LABELS,
  SALE_DELIVERY_STATUS_VARIANTS,
  getSalePaymentConditionLabel,
  formatCurrency,
  SALE_PAYMENT_STATUS_LABELS,
  SALE_PAYMENT_STATUS_VARIANTS,
  getSalePaymentMethodLabel,
  getSalePaidAmount,
  getSaleRemainingAmount,
} from '@/lib/sales'
import type { Sale } from '@/types/sale'
import type { SalePaymentPayload } from './register-payment-form'

type Props = {
  sale: Sale
  onAddPayment?: (saleId: string, payload: SalePaymentPayload) => Promise<boolean | void> | boolean | void
}

export function SalePaymentSummary({ sale, onAddPayment }: Props) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  const paymentList = useMemo(() => {
    if (sale.payments.length > 0) {
      return sale.payments
    }

    return (sale.paymentCondition.installments ?? [])
      .filter((installment) => installment.status === 'PAGO')
      .map((installment, index) => ({
        id: installment.id || `${sale.id}-legacy-payment-${index + 1}`,
        amount: installment.amount,
        date: installment.dueDate ?? sale.saleDate,
        paymentMethod: installment.paymentMethod,
        notes: '',
      }))
  }, [sale])

  const paidAmount = sale.paidAmount || getSalePaidAmount({ payments: paymentList, paymentCondition: sale.paymentCondition, total: sale.total })
  const remainingAmount = sale.remainingAmount || getSaleRemainingAmount(sale.total, paidAmount)
  const paymentStatus = sale.paymentStatus

  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <DefinitionList
          columns={2}
          items={[
            {
              label: 'Condição de Pagamento',
              value: <Badge variant={sale.paymentStatus === 'PAID' ? 'success' : sale.paymentStatus === 'PARTIAL' ? 'warning' : 'neutral'}>{getSalePaymentConditionLabel(sale.paymentCondition)}</Badge>,
            },
            { label: 'Status do pagamento', value: <Badge variant={SALE_PAYMENT_STATUS_VARIANTS[paymentStatus]}>{SALE_PAYMENT_STATUS_LABELS[paymentStatus]}</Badge> },
            { label: 'Forma de Pagamento', value: getSalePaymentMethodLabel(sale.paymentCondition, sale.paymentMethod, paymentList) },
            { label: 'Valor pago', value: formatCurrency(paidAmount) },
            { label: 'Valor pendente', value: formatCurrency(remainingAmount) },
            { label: 'É para entrega?', value: <Badge variant={getSaleDeliveryFlagVariant(sale.isDelivery)}>{getSaleDeliveryFlagLabel(sale.isDelivery)}</Badge> },
            {
              label: 'Status da entrega',
              value: <Badge variant={SALE_DELIVERY_STATUS_VARIANTS[sale.deliveryStatus]}>{SALE_DELIVERY_STATUS_LABELS[sale.deliveryStatus]}</Badge>,
            },
            { label: 'Previsão de Entrega', value: sale.deliveryDate ? sale.deliveryDate.slice(0, 10) : 'Sem previsão' },
          ]}
        />

        <div className="mt-4 space-y-3">
          <div className="text-sm font-medium text-slate-900">Histórico de pagamentos</div>
          {paymentList.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum pagamento registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {paymentList.map((payment) => (
                <div key={payment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900">{payment.paymentMethod || 'Sem forma'}</span>
                    <span className="text-slate-500">{payment.date.slice(0, 10)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-slate-500">
                    <span>{payment.notes || 'Pagamento registrado'}</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {onAddPayment && sale.paymentStatus !== 'PAID' && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPaymentForm((current) => !current)}>
                {showPaymentForm ? 'Ocultar pagamento' : 'Registrar pagamento'}
              </Button>
            </div>
            {showPaymentForm ? (
              <RegisterPaymentForm
                saleId={sale.id}
                onSubmit={onAddPayment}
                onSuccess={() => setShowPaymentForm(false)}
                onCancel={() => setShowPaymentForm(false)}
                submitLabel="Confirmar pagamento"
              />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
