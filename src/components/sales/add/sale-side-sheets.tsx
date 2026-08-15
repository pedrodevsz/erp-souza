"use client"

import { useMemo } from 'react'
import { BarChart3, CheckCircle2, CreditCard, PanelRightOpen, UserRound } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { SalePaymentCard } from './sale-payment-card'
import { SaleSummaryCard } from './sale-summary-card'
import { formatCurrency, getSalePaymentConditionLabel, getSalePaymentConditionVariant, isImmediateSalePaymentCondition } from '@/lib/sales'

type PanelKey = 'summary' | 'payment' | 'quick'

type Props = {
  openPanel: PanelKey | null
  onOpenPanel: (panel: PanelKey | null) => void
  subtotal: number
  discount: number
  shipping: number
  otherCosts: number
  total: number
  onDiscountChange: (value: number) => void
  onShippingChange: (value: number) => void
  onOtherCostsChange: (value: number) => void
  paymentMethod: string
  onPaymentMethodChange: (value: string) => void
  paymentConditionType: string
  initialPayment: number
  onInitialPaymentChange: (value: number) => void
  change: number
  remainingAfterInitial: number
  customerName: string
  sellerName: string
  itemsCount: number
  itemsQuantity: number
  productsCount: number
}

export function SaleSideSheets({
  openPanel,
  onOpenPanel,
  subtotal,
  discount,
  shipping,
  otherCosts,
  total,
  onDiscountChange,
  onShippingChange,
  onOtherCostsChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentConditionType,
  initialPayment,
  onInitialPaymentChange,
  change,
  remainingAfterInitial,
  customerName,
  sellerName,
  itemsCount,
  itemsQuantity,
  productsCount,
}: Props) {
  const activePanel = openPanel ?? 'summary'
  const sheetMeta = useMemo(() => {
    switch (activePanel) {
      case 'payment':
        return {
          title: 'Pagamento',
          description: 'Confirme o meio de pagamento e revise o troco antes de concluir.',
        }
      case 'quick':
        return {
          title: 'Conferência',
          description: 'Veja em um só lugar o estado atual da venda.',
        }
      case 'summary':
      default:
        return {
          title: 'Resumo da venda',
          description: 'Reveja os valores consolidados da venda e os ajustes financeiros.',
        }
    }
  }, [activePanel])

  return (
    <>
      <Card className="border-slate-200/80 bg-white shadow-sm">
        <CardContent className="space-y-3 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <PanelRightOpen className="h-4 w-4 text-sky-600" />
            Painéis da venda
          </div>
          <p className="text-sm text-slate-500">Abra um painel para conferir valores, pagamento e o estado atual da venda.</p>

          <div className="grid gap-3">
            <Button
              type="button"
              onClick={() => onOpenPanel('summary')}
              variant="outline"
              className="justify-start rounded-xl border-slate-200 bg-white py-4"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Resumo financeiro
            </Button>
            <Button
              type="button"
              onClick={() => onOpenPanel('payment')}
              variant="outline"
              className="justify-start rounded-xl border-slate-200 bg-white py-4"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pagamento
            </Button>
            <Button
              type="button"
              onClick={() => onOpenPanel('quick')}
              variant="outline"
              className="justify-start rounded-xl border-slate-200 bg-white py-4"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Conferência
            </Button>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Total atual</span>
              <span className="font-semibold text-sky-700">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={openPanel !== null} onOpenChange={(open) => onOpenPanel(open ? activePanel : null)}>
        <SheetContent className="max-w-[520px] bg-slate-50">
          <SheetHeader>
            <SheetTitle>{sheetMeta.title}</SheetTitle>
            <SheetDescription>{sheetMeta.description}</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 py-5">
            {activePanel === 'summary' && (
              <SaleSummaryCard
                subtotal={subtotal}
                discount={discount}
                shipping={shipping}
                otherCosts={otherCosts}
                total={total}
                onDiscountChange={onDiscountChange}
                onShippingChange={onShippingChange}
                onOtherCostsChange={onOtherCostsChange}
              />
            )}

            {activePanel === 'payment' && (
              <SalePaymentCard
                paymentConditionType={paymentConditionType}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={onPaymentMethodChange}
                initialPayment={initialPayment}
                onInitialPaymentChange={onInitialPaymentChange}
                total={total}
                remainingAfterInitial={remainingAfterInitial}
              />
            )}

            {activePanel === 'quick' && (
              <Card>
                <CardContent className="space-y-4 px-6 py-6 text-sm text-slate-600">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">Cliente</div>
                      <div className="mt-1 flex items-center gap-2 font-medium text-slate-900">
                        <UserRound className="h-4 w-4 text-sky-600" />
                        {customerName}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">Vendedor</div>
                      <div className="mt-1 flex items-center gap-2 font-medium text-slate-900">
                        <UserRound className="h-4 w-4 text-sky-600" />
                        {sellerName}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">Itens</div>
                      <div className="mt-1 font-medium text-slate-900">{itemsCount} item(s)</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">Quantidade total</div>
                      <div className="mt-1 font-medium text-slate-900">{itemsQuantity.toFixed(1)} un</div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Condição de pagamento</div>
                      <div className="mt-1 font-medium text-slate-900">
                        <Badge variant={getSalePaymentConditionVariant(paymentConditionType)}>
                          {getSalePaymentConditionLabel(paymentConditionType)}
                        </Badge>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Forma de pagamento</div>
                      <div className="mt-1 font-medium text-slate-900">
                        {!paymentConditionType
                          ? 'Selecione a condição'
                          : isImmediateSalePaymentCondition(paymentConditionType)
                            ? paymentMethod || 'Não definida'
                            : `Entrada de ${formatCurrency(initialPayment)}`
                        }
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    <div className="flex items-center gap-2 font-medium">
                      <Badge variant="success">Resumo pronto</Badge>
                      <span>{productsCount} opção(ões) de produto para seleção</span>
                    </div>
                    <p className="mt-2">
                      Ao salvar a venda, o estoque dos produtos será baixado automaticamente e poderá ser revertido em caso de cancelamento.
                    </p>
                    <p className="mt-2 font-medium">
                      Total atual: <span className="text-emerald-700">{formatCurrency(total)}</span>
                    </p>
                    <p className="mt-1 font-medium">
                      {isImmediateSalePaymentCondition(paymentConditionType) ? (
                        <>
                          Troco estimado: <span className={change >= 0 ? 'text-emerald-700' : 'text-red-600'}>{formatCurrency(change)}</span>
                        </>
                      ) : (
                        <>
                          Saldo após a entrada: <span className="text-amber-700">{formatCurrency(remainingAfterInitial)}</span>
                        </>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
