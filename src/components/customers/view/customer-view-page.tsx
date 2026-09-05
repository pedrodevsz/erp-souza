"use client"

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { PageLoading } from '@/components/shared/page-loading'
import { Button } from '@/components/ui'
import { ToastProvider, useToast } from '@/components/ui/toast-provider'
import { PanelRightOpen } from 'lucide-react'
import { CustomerPersonalInfo } from './customer-personal-info'
import { CustomerAddress } from './customer-address'
import { CustomerNotes } from './customer-notes'
import { CustomerOrdersSidebar } from './customer-orders-sidebar'
import { CustomerActions } from './customer-actions'
import { useSales } from '@/hooks/sales/useSales'
import { useCustomerViewPage } from '@/hooks/customers/useCustomerViewPage'
import { useSaleStore } from '@/stores/useSaleStore'
import { getFeedbackErrorMessage } from '@/lib/messages/feedback'
import type { SalePaymentPayload } from '@/components/sales/view/register-payment-form'

type Props = {
  id: string
}

function CustomerViewContent({ id }: Props) {
  const toast = useToast()
  const { customer, loading } = useCustomerViewPage(id)
  const { allSales, loading: salesLoading, addSalePayment } = useSales()
  const [ordersPanelOpen, setOrdersPanelOpen] = useState(false)

  const customerSales = useMemo(() => allSales.filter((sale) => sale.customerId === id), [allSales, id])

  const handleAddPayment = async (saleId: string, payload: SalePaymentPayload) => {
    const updated = await addSalePayment(saleId, payload)
    if (!updated) {
      toast.push({
        title: 'Erro',
        description: getFeedbackErrorMessage(useSaleStore.getState().error, 'Não foi possível registrar o pagamento.'),
        type: 'error',
      })
      return false
    }

    toast.push({ title: 'Sucesso', description: 'Pagamento registrado com sucesso.', type: 'success' })
    return true
  }

  if (loading) {
    return <PageLoading label="Carregando cliente..." />
  }

  if (!customer) {
    return <div className="rounded-2xl border bg-white p-6 text-slate-500">Cliente não encontrado.</div>
  }

  return (
    <div className="space-y-4">
      <PageHeader title={`Cliente: ${customer.name}`} description="Visualização de cliente" />
      <div className="flex flex-col gap-3 px-4 sm:flex-row sm:justify-end sm:px-6">
        <Button type="button" variant="outline" onClick={() => setOrdersPanelOpen(true)} disabled={salesLoading} className="w-full sm:w-auto">
          <PanelRightOpen className="mr-2 h-4 w-4" />
          Painel de Pedidos
        </Button>
      </div>
      <div className="space-y-4 px-4 pb-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CustomerPersonalInfo name={customer.name} document={customer.document} phone={customer.phone} />
          <CustomerAddress addresses={customer.addresses} />
        </div>

        <CustomerNotes notes={customer.notes} />

        <CustomerActions customerId={id} />
      </div>
      <CustomerOrdersSidebar
        customerName={customer.name}
        sales={customerSales}
        open={ordersPanelOpen}
        onOpenChange={setOrdersPanelOpen}
        loading={salesLoading}
        onAddPayment={handleAddPayment}
      />
    </div>
  )
}

export function CustomerViewPage({ id }: Props) {
  return (
    <ToastProvider>
      <CustomerViewContent id={id} />
    </ToastProvider>
  )
}
