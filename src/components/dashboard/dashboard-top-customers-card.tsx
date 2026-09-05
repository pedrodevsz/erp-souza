"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { PageLoading } from '@/components/shared/page-loading'
import { EmptyStateAction } from '@/components/shared'
import { aggregateTopCustomers, formatDashboardCurrency, formatDashboardDate, formatDashboardNumber } from '@/lib/dashboard'
import type { DashboardCustomerPeriod, DashboardInsightsSectionProps } from '@/types/dashboard'

const CUSTOMER_PERIOD_OPTIONS: Array<{ value: DashboardCustomerPeriod; label: string }> = [
  { value: 'month', label: 'Este Mês' },
  { value: 'quarter', label: 'Últimos 3 Meses' },
  { value: 'semester', label: 'Últimos 6 Meses' },
  { value: 'year', label: 'Este Ano' },
]

export function DashboardTopCustomersCard({ customers, sales, loading, error, onRetry }: DashboardInsightsSectionProps) {
  const [period, setPeriod] = useState<DashboardCustomerPeriod>('month')
  const [visibleRows, setVisibleRows] = useState(5)

  const rows = useMemo(() => aggregateTopCustomers(sales, customers, period), [customers, period, sales])
  const canLoadMore = visibleRows < rows.length
  const state = loading ? 'loading' : error ? 'error' : rows.length === 0 ? 'empty' : 'ready'
  const shownRows = rows.slice(0, visibleRows)

  if (loading) {
    return <PageLoading />
  }

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold text-slate-900 sm:text-[15px]">
            Principais Clientes <span className="font-normal text-slate-500">(por volume de compras)</span>
          </CardTitle>
        </div>

        <Select
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value as DashboardCustomerPeriod)
            setVisibleRows(5)
          }}
          className="h-8 w-full rounded-lg border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm outline-none sm:w-[120px]"
          aria-label="Filtrar principais clientes"
        >
          {CUSTOMER_PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-3 p-3.5 md:hidden">
          {state === 'error' ? (
            <EmptyStateAction
              title="Falha ao carregar clientes"
              description={error ?? 'Tente novamente para atualizar os dados.'}
              actionLabel="Tentar novamente"
              onAction={onRetry}
            />
          ) : state === 'empty' ? (
            <EmptyStateAction title="Sem clientes no período" description="Ajuste o filtro para ver mais compras." />
          ) : (
            shownRows.map((row, index) => (
              <Link
                key={row.id}
                href={`/dashboard/customers/${row.id}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">#{index + 1}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-900">{row.name}</p>
                  </div>
                  <p className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                    {formatDashboardNumber(row.orders)} pedidos
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-slate-500">Total comprado</p>
                    <p className="mt-0.5 font-semibold text-slate-900">{formatDashboardCurrency(row.totalPurchased)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Última compra</p>
                    <p className="mt-0.5 font-medium text-slate-700">{formatDashboardDate(row.lastPurchaseDate)}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <Table className="hidden text-[12px] md:table">
          <TableHeader>
            <TableRow className="border-slate-100">
              <TableHead className="w-10 px-4 py-3 text-[11px] font-semibold text-slate-500">#</TableHead>
              <TableHead className="px-4 py-3 text-[11px] font-semibold text-slate-500">Cliente</TableHead>
              <TableHead className="w-32 whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-slate-500">Total Comprado</TableHead>
              <TableHead className="w-20 whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-slate-500">Pedidos</TableHead>
              <TableHead className="w-28 whitespace-nowrap px-4 py-3 text-[11px] font-semibold text-slate-500">Última Compra</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {state === 'error' ? (
              <TableRow className="border-slate-100">
                <TableCell colSpan={5} className="px-4 py-8">
                  <EmptyStateAction
                    title="Falha ao carregar clientes"
                    description={error ?? 'Tente novamente para atualizar os dados.'}
                    actionLabel="Tentar novamente"
                    onAction={onRetry}
                  />
                </TableCell>
              </TableRow>
            ) : state === 'empty' ? (
              <TableRow className="border-slate-100">
                <TableCell colSpan={5} className="px-4 py-8">
                  <EmptyStateAction
                    title="Sem clientes no período"
                    description="Ajuste o filtro para ver mais compras."
                  />
                </TableCell>
              </TableRow>
            ) : (
              shownRows.map((row, index) => (
                <TableRow key={row.id} className="border-slate-100">
                  <TableCell className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">{index + 1}</TableCell>
                  <TableCell className="px-4 py-3 font-medium text-slate-900">{row.name}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDashboardCurrency(row.totalPurchased)}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDashboardNumber(row.orders)}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDashboardDate(row.lastPurchaseDate)}</TableCell>
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
            Ver mais clientes
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  )
}
