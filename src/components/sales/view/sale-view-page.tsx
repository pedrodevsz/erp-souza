"use client"

import { PageHeader } from '@/components/page-header'
import { PageLoading } from '@/components/shared/page-loading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SaleGeneralCard, SaleItemsTable, SalePaymentSummary, SaleHistoryCard } from '@/components/sales/view'
import { useSaleViewPage } from '@/hooks/sales/useSaleViewPage'
import { createSaleReference } from '@/lib/sales'

type Props = {
  id: string
}

export function SaleViewPage({ id }: Props) {
  const { sale, history, loading, handleAddPayment } = useSaleViewPage(id)

  if (loading) {
    return <PageLoading label="Carregando venda..." />
  }

  if (!sale) {
    return <div className="rounded-2xl border bg-white p-6 text-slate-500">Venda não encontrada.</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Venda ${createSaleReference(sale.id)}`} description="Visualização completa da venda." />

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="pagamento">Pagamento</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <SaleGeneralCard sale={sale} />
        </TabsContent>

        <TabsContent value="produtos" className="space-y-4">
          <SaleItemsTable items={sale.items} saleId={sale.id} />
        </TabsContent>

        <TabsContent value="pagamento" className="space-y-4">
          <SalePaymentSummary sale={sale} onAddPayment={handleAddPayment} />
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <SaleHistoryCard history={history} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
