"use client"

import { CreateButton, Input, Label, Select } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SALE_PAYMENT_CONDITION_OPTIONS, isImmediateSalePaymentCondition } from '@/lib/sales'
import { SaleCustomerAutocomplete } from './sale-customer-autocomplete'
import type { Customer } from '@/types/customer'
import type { Employee } from '@/types/employee'

type Props = {
  customerId: string
  customerQuery: string
  onCustomerQueryChange: (value: string) => void
  onCustomerSelect: (customer: Customer) => void
  customers: Customer[]
  onOpenNewCustomer: () => void
  isDelivery: boolean
  onIsDeliveryChange: (value: boolean) => void
  saleDate: string
  onSaleDateChange: (value: string) => void
  sellerId: string
  onSellerChange: (value: string) => void
  sellerEmployees: Pick<Employee, 'id' | 'name'>[]
  sellerLoading: boolean
  sellerError: string | null
  paymentConditionType: string
  onPaymentConditionChange: (value: string) => void
  paymentMethod: string
  onPaymentMethodChange: (value: string) => void
  initialPayment: number
  onInitialPaymentChange: (value: number) => void
  remainingAfterInitial: number
  deliveryDate: string
  onDeliveryDateChange: (value: string) => void
}

export function SaleInformationCard({
  customerId,
  customerQuery,
  onCustomerQueryChange,
  onCustomerSelect,
  customers,
  onOpenNewCustomer,
  isDelivery,
  onIsDeliveryChange,
  saleDate,
  onSaleDateChange,
  sellerId,
  onSellerChange,
  sellerEmployees,
  sellerLoading,
  sellerError,
  paymentConditionType,
  onPaymentConditionChange,
  paymentMethod,
  onPaymentMethodChange,
  initialPayment,
  onInitialPaymentChange,
  remainingAfterInitial,
  deliveryDate,
  onDeliveryDateChange,
}: Props) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Dados da Venda</CardTitle>
        <p className="text-sm text-slate-500">Preencha os dados principais da venda para seguir com a montagem do pedido.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <SaleCustomerAutocomplete
              customerId={customerId}
              customerQuery={customerQuery}
              onCustomerQueryChange={onCustomerQueryChange}
              onCustomerSelect={onCustomerSelect}
              customers={customers}
              onOpenNewCustomer={onOpenNewCustomer}
              showCreateButton={false}
            />
          </div>

          <div className="md:col-span-4">
            <Label className="mb-2 block">Novo Cliente</Label>
            <CreateButton
              name="Novo Cliente"
              onClick={onOpenNewCustomer}
              variant="outline"
              className="h-10 w-full justify-center whitespace-nowrap px-3 md:w-auto"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <label className="flex h-10 items-center gap-3 rounded-md border border-gray-200 bg-white px-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isDelivery}
                onChange={(e) => onIsDeliveryChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              É para entrega?
            </label>
          </div>

          <div className="md:col-span-4">
            <Label>Data da Venda *</Label>
            <Input type="date" value={saleDate} onChange={(e) => onSaleDateChange(e.target.value)} className="w-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <Label>Vendedor *</Label>
            <Select
              value={sellerId}
              onChange={(e) => onSellerChange(e.target.value)}
              disabled={sellerLoading || sellerEmployees.length === 0 || Boolean(sellerError)}
            >
              {sellerLoading ? (
                <option value="">Carregando vendedores...</option>
              ) : sellerError ? (
                <option value="">Não foi possível carregar os vendedores.</option>
              ) : sellerEmployees.length === 0 ? (
                <option value="">Nenhum vendedor ativo cadastrado.</option>
              ) : (
                <>
                  <option value="">Selecione um vendedor</option>
                  {sellerEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </>
              )}
            </Select>
          </div>

          <div className="md:col-span-4">
            <Label>Condição de Pagamento *</Label>
            <Select value={paymentConditionType} onChange={(e) => onPaymentConditionChange(e.target.value)}>
              <option value="">Selecione a condição</option>
              {SALE_PAYMENT_CONDITION_OPTIONS.map((condition) => (
                <option key={condition.value} value={condition.value}>
                  {condition.label}
                </option>
              ))}
            </Select>
          </div>

          {isImmediateSalePaymentCondition(paymentConditionType) && (
            <div className="md:col-span-4">
              <Label>Forma de Pagamento *</Label>
              <Select value={paymentMethod} onChange={(e) => onPaymentMethodChange(e.target.value)}>
                <option value="">Selecione a forma</option>
                {['Dinheiro', 'Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto'].map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {!isImmediateSalePaymentCondition(paymentConditionType) && paymentConditionType && (
            <div className="md:col-span-4">
              <Label>Valor da primeira parcela *</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={initialPayment}
                onChange={(e) => onInitialPaymentChange(Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-2 text-xs text-slate-500">Saldo após a entrada: R$ {remainingAfterInitial.toFixed(2)}</p>
            </div>
          )}
        </div>

        {!isImmediateSalePaymentCondition(paymentConditionType) && paymentConditionType && (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Registre pagamentos futuros no painel de pagamento ao lado, sem parcelas fixas ou vencimentos automáticos.
          </p>
        )}

        {isDelivery && (
          <div className="max-w-xs">
            <Label>Previsão de Entrega</Label>
            <Input type="date" value={deliveryDate} onChange={(e) => onDeliveryDateChange(e.target.value)} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
