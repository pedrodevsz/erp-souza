"use client"

import { useMemo, useState } from 'react'
import { ChevronDown, EllipsisVertical, Package, ShoppingCart } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DefinitionList } from '@/components/shared'
import { PageLoading } from '@/components/shared/page-loading'
import {
  createSaleReference,
  formatCurrency,
  getSalePaymentConditionLabel,
  SALE_PAYMENT_STATUS_LABELS,
  SALE_PAYMENT_STATUS_VARIANTS,
  getSalePaymentMethodLabel,
} from '@/lib/sales'
import type { Sale } from '@/types/sale'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { RegisterPaymentForm } from '@/components/sales/view/register-payment-form'
import type { SalePaymentPayload } from '@/components/sales/view/register-payment-form'

type Props = {
  customerName: string
  sales: Sale[]
  open: boolean
  onOpenChange: (open: boolean) => void
  loading?: boolean
  onAddPayment?: (saleId: string, payload: SalePaymentPayload) => Promise<boolean | void> | boolean | void
}

type SaleGroup = {
  sale: Sale
  itemCount: number
  totalQuantity: number
}

function getPaymentMethodsLabel(sale: Sale) {
  const methods = (sale.payments.length > 0 ? sale.payments : sale.paymentCondition.installments ?? [])
    .map((entry) => entry.paymentMethod.trim())
    .filter(Boolean)

  if (methods.length === 0) {
    return 'Não definida'
  }

  const uniqueMethods = Array.from(new Set(methods))
  return uniqueMethods.length === 1 ? uniqueMethods[0] : 'Múltiplas formas'
}

function CustomerSaleActionSheet({
  sale,
  open,
  onOpenChange,
  onAddPayment,
}: {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddPayment?: (saleId: string, payload: SalePaymentPayload) => Promise<boolean | void> | boolean | void
}) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  if (!sale) {
    return null
  }

  const paidAmount = sale.paidAmount
  const pendingAmount = sale.remainingAmount
  const paymentStatus = SALE_PAYMENT_STATUS_LABELS[sale.paymentStatus]
  const paymentMethods = getPaymentMethodsLabel(sale)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-[560px] bg-slate-50">
        <SheetHeader>
          <SheetTitle>
            Painel da venda - {createSaleReference(sale.id)}
          </SheetTitle>
          <SheetDescription>Veja de uma vez os dados de entrega e pagamento desta venda.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6 py-5">
          <Card className="border-sky-100 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">Resumo da venda</CardTitle>
            </CardHeader>
            <CardContent>
              <DefinitionList
                columns={2}
                items={[
                  { label: 'Cliente', value: sale.customerName },
                  { label: 'Total da venda', value: formatCurrency(sale.total) },
                  {
                    label: 'Condição de pagamento',
                    value: <Badge variant={sale.paymentStatus === 'PAID' ? 'success' : sale.paymentStatus === 'PARTIAL' ? 'warning' : 'neutral'}>{getSalePaymentConditionLabel(sale.paymentCondition)}</Badge>,
                  },
                  { label: 'Forma de pagamento', value: paymentMethods },
                  { label: 'Valor pago', value: formatCurrency(paidAmount) },
                  { label: 'Valor pendente', value: formatCurrency(pendingAmount) },
                  { label: 'Status do pagamento', value: <Badge variant={SALE_PAYMENT_STATUS_VARIANTS[sale.paymentStatus]}>{paymentStatus}</Badge> },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">Dados de entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <DefinitionList
                columns={2}
                items={[
                  { label: 'É para entrega?', value: sale.isDelivery ? 'Sim' : 'Não' },
                  { label: 'Previsão de entrega', value: sale.deliveryDate ? sale.deliveryDate.slice(0, 10) : 'Sem previsão' },
                  { label: 'Data da venda', value: sale.saleDate.slice(0, 10) },
                  { label: 'Status da entrega', value: sale.deliveryStatus === 'DELIVERED' ? 'Entregue' : 'Pendente' },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">Dados de pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sale.paymentStatus === 'PAID' && sale.remainingAmount === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Pagamento concluído.
                </div>
              ) : (sale.payments.length === 0 && (sale.paymentCondition.installments?.length ?? 0) === 0) ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Nenhum pagamento informado para esta venda.
                </div>
              ) : (
                <div className="space-y-2">
                  {(sale.payments.length > 0 ? sale.payments : sale.paymentCondition.installments ?? []).map((entry, index) => (
                    <div key={entry.id ?? `${sale.id}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-slate-900">
                          {getSalePaymentMethodLabel(sale.paymentCondition, sale.paymentMethod, sale.payments)}
                        </div>
                        <Badge variant="success">Registrado</Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{'date' in entry ? entry.date.slice(0, 10) : entry.dueDate ? entry.dueDate.slice(0, 10) : 'Sem data'}</span>
                        <span>{formatCurrency(entry.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {onAddPayment && sale.paymentStatus !== 'PAID' ? (
                <div className="space-y-3 pt-2">
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
              ) : null}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar painel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function CustomerOrdersSidebar({ customerName, sales, open, onOpenChange, loading = false, onAddPayment }: Props) {
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null)
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

  const groupedSales = useMemo<SaleGroup[]>(
    () =>
      sales.map((sale) => ({
        sale,
        itemCount: sale.items.length,
        totalQuantity: sale.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
    [sales]
  )

  const selectedSale = useMemo(() => sales.find((sale) => sale.id === selectedSaleId) ?? null, [sales, selectedSaleId])

  const handleOpenAction = (sale: Sale) => {
    setSelectedSaleId(sale.id)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="max-w-[520px] bg-slate-50 p-0">
          <SheetHeader>
            <SheetTitle>Pedidos de {customerName}</SheetTitle>
            <SheetDescription>Selecione um pedido para ver os produtos comprados dentro dele.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 py-5">
            <Card className="border-sky-100 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">Resumo de pedidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Pedidos encontrados</span>
                  <strong>{groupedSales.length}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Itens vendidos</span>
                  <strong>{groupedSales.reduce((sum, entry) => sum + entry.totalQuantity, 0)}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Valor acumulado</span>
                  <strong>{formatCurrency(groupedSales.reduce((sum, entry) => sum + entry.sale.total, 0))}</strong>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <PageLoading className="min-h-[240px]" />
            ) : groupedSales.length === 0 ? (
              <Card className="border-dashed bg-white">
                <CardContent className="flex items-center gap-3 py-6 text-sm text-slate-500">
                  <ShoppingCart className="h-4 w-4" />
                  Nenhum pedido encontrado para este cliente.
                </CardContent>
              </Card>
            ) : (
              groupedSales.map(({ sale, itemCount, totalQuantity }) => {
                const expanded = expandedSaleId === sale.id

                return (
                  <Card key={sale.id} className="overflow-hidden border-slate-200 bg-white shadow-sm">
                    <div className="flex items-start gap-2 px-4 py-4">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-start justify-between gap-4 text-left transition hover:bg-slate-50"
                        onClick={() => setExpandedSaleId((current) => (current === sale.id ? null : sale.id))}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{createSaleReference(sale.id)}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{sale.saleDate.slice(0, 10)}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {itemCount} produto(s), {totalQuantity} unidade(s)
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {sale.paymentStatus === 'PAID'
                              ? 'Pago'
                              : `Saldo ${formatCurrency(sale.remainingAmount)}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="text-sm font-medium">{formatCurrency(sale.total)}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      <Button type="button" variant="ghost" size="sm" className="h-9 w-9 shrink-0 p-0 text-slate-500" onClick={() => handleOpenAction(sale)}>
                        <EllipsisVertical className="h-4 w-4" />
                        <span className="sr-only">Abrir painel da venda</span>
                      </Button>
                    </div>

                    {expanded && (
                      <CardContent className="border-t border-slate-100 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Package className="h-4 w-4 text-sky-600" />
                          Produtos do pedido
                        </div>

                        <div className="space-y-3">
                          {sale.items.map((item) => (
                            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-medium text-slate-900">{item.productName}</p>
                                  <p className="text-xs text-slate-500">
                                    SKU: {item.sku || 'Não informado'} • {item.unit}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.subtotal)}</p>
                                  <p className="text-xs text-slate-500">
                                    {item.quantity} x {formatCurrency(item.unitPrice)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CustomerSaleActionSheet
        sale={selectedSale}
        open={selectedSale !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedSaleId(null)
          }
        }}
        onAddPayment={onAddPayment}
      />
    </>
  )
}
