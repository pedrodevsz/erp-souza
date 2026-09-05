"use client"

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { InventorySummaryCards } from './inventory-summary-cards'
import { InventoryFiltersCard } from './inventory-filters-card'
import { InventoryTable } from './inventory-table'
import { InventorySidebar } from './inventory-sidebar'
import { InventoryDeleteDialog } from './inventory-delete-dialog'
import { useInventory } from '@/hooks/inventories/useInventory'
import { PanelRightOpen } from 'lucide-react'

export function InventoryList() {
  const router = useRouter()
  const toast = useToast()
  const {
    items,
    paginatedItems,
    loading,
    summary,
    categoryBreakdown,
    recentMovements,
    filters,
    search,
    page,
    totalPages,
    setSearch,
    setPage,
    setFilters,
    deleteItem,
  } = useInventory()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftSearch, setDraftSearch] = useState(search)
  const [draftCategory, setDraftCategory] = useState(filters.category)
  const [draftSupplier, setDraftSupplier] = useState(filters.supplier)
  const [draftStatus, setDraftStatus] = useState(filters.status)
  const [panelOpen, setPanelOpen] = useState(false)

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))).sort(), [items])
  const suppliers = useMemo(() => Array.from(new Set(items.map((item) => item.supplier))).sort(), [items])

  const handleApply = () => {
    setSearch(draftSearch)
    setFilters({
      category: draftCategory,
      supplier: draftSupplier,
      status: draftStatus,
    })
  }

  const handleReset = () => {
    setDraftSearch('')
    setDraftCategory('all')
    setDraftSupplier('all')
    setDraftStatus('all')
    setSearch('')
    setFilters({
      category: 'all',
      supplier: 'all',
      status: 'all',
    })
  }

  const openDelete = (id: string) => {
    setSelectedId(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedId) return
    const deleted = await deleteItem(selectedId)
    if (deleted) {
      toast.push({ title: 'Sucesso', description: 'Item excluído com sucesso', type: 'success' })
    }
    setDeleteDialogOpen(false)
    setSelectedId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque" description="Controle dos itens do estoque consumindo compras e vendas do catálogo real de produtos." />

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          onClick={() => setPanelOpen(true)}
          variant="outline"
        >
          <PanelRightOpen className="mr-2 h-4 w-4" />
          Painel do Estoque
        </Button>
      </div>

      <InventorySummaryCards
        totalProducts={summary.totalProducts}
        itemsInStock={summary.itemsInStock}
        lowStock={summary.lowStock}
        noStock={summary.noStock}
        totalValue={summary.totalValue}
      />

      <div className="space-y-6">
        <InventoryFiltersCard
          search={draftSearch}
          category={draftCategory}
          supplier={draftSupplier}
          status={draftStatus}
          categories={categories}
          suppliers={suppliers}
          onSearchChange={setDraftSearch}
          onCategoryChange={setDraftCategory}
          onSupplierChange={setDraftSupplier}
          onStatusChange={setDraftStatus}
          onApply={handleApply}
          onReset={handleReset}
        />

        <InventoryTable
          items={paginatedItems}
          loading={loading}
          onView={(id) => router.push(`/dashboard/stock/${id}`)}
          onEdit={(id) => router.push(`/dashboard/stock/${id}/edit`)}
          onDelete={openDelete}
        />

        <div className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3 text-sm">
          <div>
            Mostrando {paginatedItems.length} de {summary.totalProducts} itens
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Painel do Estoque</SheetTitle>
            <SheetDescription>Resumo consolidado, movimentações recentes e distribuição por categoria.</SheetDescription>
          </SheetHeader>
          <div className="px-6 py-5">
            <InventorySidebar
              totalProducts={summary.totalProducts}
              totalStock={summary.totalStock}
              totalValue={summary.totalValue}
              minimumStock={summary.minimumStock}
              availableStock={summary.availableStock}
              recentMovements={recentMovements}
              categoryBreakdown={categoryBreakdown}
            />
          </div>
        </SheetContent>
      </Sheet>

      <InventoryDeleteDialog
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
