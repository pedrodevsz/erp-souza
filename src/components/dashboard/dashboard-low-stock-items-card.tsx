"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { PageLoading } from '@/components/shared/page-loading'
import { EmptyStateAction } from '@/components/shared'
import { aggregateLowStockItems, formatDashboardNumber, getLowStockLocations } from '@/lib/dashboard'
import type { DashboardInsightsSectionProps } from '@/types/dashboard'

const LOCATION_ALL_VALUE = 'all'

function formatStockValue(quantity: number, unit: string) {
  return `${formatDashboardNumber(quantity)} ${unit}`
}

export function DashboardLowStockItemsCard({ inventoryItems, loading, error, onRetry }: DashboardInsightsSectionProps) {
  const [location, setLocation] = useState(LOCATION_ALL_VALUE)
  const [visibleRows, setVisibleRows] = useState(5)

  const locations = useMemo(() => getLowStockLocations(inventoryItems), [inventoryItems])
  const effectiveLocation = location !== LOCATION_ALL_VALUE && !locations.includes(location) ? LOCATION_ALL_VALUE : location
  const rows = useMemo(() => aggregateLowStockItems(inventoryItems, effectiveLocation), [effectiveLocation, inventoryItems])
  const canLoadMore = visibleRows < rows.length
  const state = loading ? 'loading' : error ? 'error' : rows.length === 0 ? 'empty' : 'ready'
  const shownRows = rows.slice(0, visibleRows)

  if (loading) {
    return <PageLoading />
  }

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <CardTitle className="text-sm font-semibold text-slate-900 sm:text-[15px]">Itens em Falta ou Abaixo de 5 no Estoque</CardTitle>

        <Select
          value={effectiveLocation}
          onChange={(event) => {
            setLocation(event.target.value)
            setVisibleRows(5)
          }}
          className="h-8 w-full rounded-lg border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm outline-none sm:w-[130px]"
          aria-label="Filtrar depósito"
        >
          <option value={LOCATION_ALL_VALUE}>Todos Depósitos</option>
          {locations.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </Select>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-3 p-3.5 md:hidden">
          {state === 'error' ? (
            <EmptyStateAction
              title="Falha ao carregar estoque"
              description={error ?? 'Tente novamente para atualizar os itens críticos.'}
              actionLabel="Tentar novamente"
              onAction={onRetry}
            />
          ) : state === 'empty' ? (
            <EmptyStateAction title="Nenhum item em falta ou com estoque baixo." description="Tudo está em ordem neste depósito." />
          ) : (
            shownRows.map((row) => (
              <Link
                key={row.id}
                href={`/dashboard/stock/${row.id}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm transition hover:border-amber-200 hover:bg-amber-50/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{row.productName}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{row.location}</p>
                  </div>
                  <Badge variant={row.status === 'Falta' ? 'danger' : 'warning'} className="px-2 py-0.5 text-[11px] font-medium">
                    {row.status}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-slate-500">Estoque atual</p>
                    <p className="mt-0.5 font-semibold text-slate-900">{formatStockValue(row.currentStock, row.unit)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Estoque mínimo</p>
                    <p className="mt-0.5 font-medium text-slate-700">{formatStockValue(row.minimumStock, row.unit)}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <Table className="hidden text-[12px] md:table">
          <TableHeader>
            <TableRow className="border-slate-100">
              <TableHead className="px-4 py-3 text-[11px] font-semibold text-slate-500">Produto</TableHead>
              <TableHead className="w-28 whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-slate-500">Estoque Atual</TableHead>
              <TableHead className="w-28 whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-slate-500">Estoque Mínimo</TableHead>
              <TableHead className="w-20 whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-slate-500">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {state === 'error' ? (
              <TableRow className="border-slate-100">
                <TableCell colSpan={4} className="px-4 py-8">
                  <EmptyStateAction
                    title="Falha ao carregar estoque"
                    description={error ?? 'Tente novamente para atualizar os itens críticos.'}
                    actionLabel="Tentar novamente"
                    onAction={onRetry}
                  />
                </TableCell>
              </TableRow>
            ) : state === 'empty' ? (
              <TableRow className="border-slate-100">
                <TableCell colSpan={4} className="px-4 py-8">
                  <EmptyStateAction
                    title="Nenhum item em falta ou com estoque baixo."
                    description="Tudo está em ordem neste depósito."
                  />
                </TableCell>
              </TableRow>
            ) : (
              shownRows.map((row) => (
                <TableRow key={row.id} className="border-slate-100">
                  <TableCell className="px-4 py-3 font-medium text-slate-900">{row.productName}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-slate-700">{formatStockValue(row.currentStock, row.unit)}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-slate-700">{formatStockValue(row.minimumStock, row.unit)}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3">
                    <Badge variant={row.status === 'Falta' ? 'danger' : 'warning'} className="px-2 py-0.5 text-[11px] font-medium">
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {state === 'ready' && canLoadMore && (
        <div className="border-t border-slate-100 px-4 py-3 text-center">
          <Button
            type="button"
            variant="ghost"
            className="mx-auto h-auto px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 hover:text-sky-700"
            onClick={() => setVisibleRows((current) => current + 5)}
          >
            Ver mais itens
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  )
}
