"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DefinitionList } from '@/components/shared'
import {
  createSaleReference,
  getSaleDeliveryFlagLabel,
  getSaleDeliveryFlagVariant,
  SALE_DELIVERY_STATUS_LABELS,
  SALE_DELIVERY_STATUS_VARIANTS,
  getSalePaymentConditionLabel,
  formatCurrency,
  SALE_PAYMENT_STATUS_LABELS,
  SALE_PAYMENT_STATUS_VARIANTS,
  getSalePaidAmount,
  getSaleRemainingAmount,
} from '@/lib/sales'
import type { Sale } from '@/types/sale'

type Props = {
  sale: Sale
}

export function SaleGeneralCard({ sale }: Props) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Dados Gerais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Número</div>
            <div className="text-2xl font-semibold text-slate-900">{createSaleReference(sale.id)}</div>
          </div>
          <Badge variant={SALE_DELIVERY_STATUS_VARIANTS[sale.deliveryStatus]}>{SALE_DELIVERY_STATUS_LABELS[sale.deliveryStatus]}</Badge>
        </div>

        <DefinitionList
          columns={2}
          items={[
            { label: 'Cliente', value: sale.customerName },
            { label: 'Vendedor', value: sale.sellerName },
            { label: 'Data da Venda', value: sale.saleDate.slice(0, 10) },
            { label: 'É para entrega?', value: <Badge variant={getSaleDeliveryFlagVariant(sale.isDelivery)}>{getSaleDeliveryFlagLabel(sale.isDelivery)}</Badge> },
            { label: 'Previsão de Entrega', value: sale.deliveryDate ? sale.deliveryDate.slice(0, 10) : 'Sem previsão' },
            {
              label: 'Condição de Pagamento',
              value: <Badge variant={sale.paymentStatus === 'PAID' ? 'success' : sale.paymentStatus === 'PARTIAL' ? 'warning' : 'neutral'}>{getSalePaymentConditionLabel(sale.paymentCondition)}</Badge>,
            },
            { label: 'Status do pagamento', value: <Badge variant={SALE_PAYMENT_STATUS_VARIANTS[sale.paymentStatus]}>{SALE_PAYMENT_STATUS_LABELS[sale.paymentStatus]}</Badge> },
            { label: 'Valor pago', value: formatCurrency(sale.paidAmount || getSalePaidAmount(sale)) },
            { label: 'Valor pendente', value: formatCurrency(sale.remainingAmount || getSaleRemainingAmount(sale.total, sale.paidAmount || getSalePaidAmount(sale))) },
            { label: 'Forma de Pagamento', value: sale.paymentMethod || 'Não informado' },
          ]}
        />

        {(sale.payments.length > 0 || (sale.paymentCondition.installments?.length ?? 0) > 0) && (
          <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Histórico de pagamentos</div>
            <div className="space-y-2">
              {(sale.payments.length > 0 ? sale.payments : sale.paymentCondition.installments ?? []).map((payment, index) => (
                <div key={payment.id ?? `${sale.id}-${index}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">
                      {payment.paymentMethod || 'Sem forma'}
                    </div>
                    <Badge variant="success">Registrado</Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{'date' in payment ? payment.date.slice(0, 10) : payment.dueDate ? payment.dueDate.slice(0, 10) : 'Sem data'}</span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sale.notes && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{sale.notes}</p>}
      </CardContent>
    </Card>
  )
}
