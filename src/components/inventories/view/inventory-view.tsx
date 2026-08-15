"use client"

import { useEffect, useState } from 'react'
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { PageHeader } from '@/components/page-header'
import { PageLoading } from '@/components/shared/page-loading'
import { useInventory } from '@/hooks/inventories/useInventory'
import type { InventoryItem } from '@/types/inventory'
import { calculateInventoryStatus, formatCurrency, formatDate, statusLabel, statusTone } from '@/lib/inventories/inventory'
import { InventoryActions } from './inventory-actions'
import { InventoryDetailsCard } from './inventory-details-card'
import { InventoryMovementsTable } from './inventory-movements-table'

type Props = {
  id: string
}

export function InventoryView({ id }: Props) {
  const { findById, loadMovementsByItem, movements, movementsLoading, selectItem, clearSelection } = useInventory()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      const found = await findById(id)
      if (!active) return
      setItem(found)
      setLoaded(true)
      if (found) {
        selectItem(found.id)
        await loadMovementsByItem(found.id)
      }
    }

    load()

    return () => {
      active = false
      clearSelection()
    }
  }, [clearSelection, findById, id, loadMovementsByItem, selectItem])

  if (!loaded) {
    return <PageLoading label="Carregando item..." />
  }

  if (!item) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-slate-500">
        Item de estoque não encontrado.
      </div>
    )
  }

  const status = calculateInventoryStatus(item)

  return (
    <div className="space-y-6">
      <PageHeader title={item.productName} description="Visualização do item de estoque" />

      <div className="flex items-center justify-between">
        <Badge variant={statusTone(status)}>{statusLabel(status)}</Badge>
      </div>

      <Tabs defaultValue="geral">
        <TabsList className="mb-4">
          <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <InventoryDetailsCard
              title="Dados do Produto"
              items={[
                { label: 'Nome', value: item.productName },
                { label: 'SKU', value: item.sku },
                { label: 'Categoria', value: item.category },
                { label: 'Unidade', value: item.unit },
              ]}
            />

            <InventoryDetailsCard
              title="Dados Financeiros"
              items={[
                { label: 'Preço de Custo', value: formatCurrency(item.costPrice) },
                { label: 'Porcentagem de Lucro', value: `${item.profitPercentage.toFixed(2)}%` },
                { label: 'Preço de Venda', value: formatCurrency(item.salePrice) },
                { label: 'Valor do Item', value: formatCurrency(item.currentStock * item.costPrice) },
                { label: 'Observações', value: item.notes?.trim() ? item.notes : 'Sem observações' },
              ]}
            />

            <InventoryDetailsCard
              title="Informações de Estoque"
              items={[
                { label: 'Estoque Atual', value: `${item.currentStock} ${item.unit}` },
                { label: 'Reservado', value: `${item.reservedStock} ${item.unit}` },
                { label: 'Disponível', value: `${item.availableStock} ${item.unit}` },
                { label: 'Estoque Mínimo', value: `${item.minimumStock} ${item.unit}` },
              ]}
            />

            <InventoryDetailsCard
              title="Fornecedor e Localização"
              items={[
                { label: 'Fornecedor', value: item.supplier },
                { label: 'Localização', value: item.location },
                { label: 'Última Entrada', value: formatDate(item.lastEntryDate) },
                { label: 'Última Saída', value: formatDate(item.lastOutputDate) },
              ]}
            />
          </div>

          <InventoryActions id={item.id} />
        </TabsContent>

        <TabsContent value="movimentacoes">
          <InventoryMovementsTable movements={movements} loading={movementsLoading} itemId={item.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
