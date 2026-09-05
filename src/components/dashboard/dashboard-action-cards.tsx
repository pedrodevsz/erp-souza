"use client"

import Link from 'next/link'
import { ArrowUpRight, CircleUserRound, Store, Users } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { cn } from '@/lib/utils'
import { dashboardMetricStyles } from './dashboard-styles'
import type { DashboardActionCardProps, DashboardSummaryActionHandlers } from './dashboard.types'
import { PackageSearch, ShoppingCart } from 'lucide-react'

function DashboardActionCard({ href, title, description, icon, tone, className }: DashboardActionCardProps) {
  const style = dashboardMetricStyles[tone]

  return (
    <Link
      href={href}
      className={cn(
        'group block overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md',
        className
      )}
    >
      <Card className="h-full border-0 bg-transparent shadow-none">
        <CardContent className="flex h-full min-h-[92px] items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100', style.accent, style.icon)}>
            <span>{icon}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn('text-xs font-semibold sm:text-sm', style.value)}>{title}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">{description}</p>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400 transition-transform group-hover:translate-x-0.5">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function DashboardRegistrationsCard({ onOpenCustomer, onOpenSupplier, onOpenEmployeeManager }: DashboardSummaryActionHandlers) {
  return (
    <Card className="overflow-hidden rounded-[18px] border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-900 sm:text-sm">Cadastros Rápidos</CardTitle>
        <CardDescription className="text-[11px] text-slate-500 sm:text-xs">Atalhos para os cadastros mais usados.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button
          type="button"
          onClick={onOpenCustomer}
          variant="outline"
          className="h-auto min-h-11 items-start justify-start rounded-[14px] border-blue-200 bg-blue-50 px-3 py-2 text-left text-[11px] font-medium leading-tight !whitespace-normal text-blue-700 hover:bg-blue-100 sm:text-xs"
        >
          <CircleUserRound className="h-4 w-4" />
          Novo Cliente
        </Button>
        <Button
          type="button"
          onClick={onOpenSupplier}
          variant="outline"
          className="h-auto min-h-11 items-start justify-start rounded-[14px] border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-[11px] font-medium leading-tight !whitespace-normal text-emerald-700 hover:bg-emerald-100 sm:text-xs"
        >
          <Store className="h-4 w-4" />
          Novo Fornecedor
        </Button>
        <Button
          type="button"
          onClick={onOpenEmployeeManager}
          variant="outline"
          className="h-auto min-h-11 items-start justify-start rounded-[14px] border-violet-200 bg-violet-50 px-3 py-2 text-left text-[11px] font-medium leading-tight !whitespace-normal text-violet-700 hover:bg-violet-100 sm:text-xs"
        >
          <Users className="h-4 w-4" />
          Gerenciar Funcionários
        </Button>
      </CardContent>
    </Card>
  )
}

export function DashboardQuickActionsSection(props: DashboardSummaryActionHandlers) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <DashboardActionCard
        href="/dashboard/sales/new"
        title="Nova Venda"
        description=""
        tone="blue"
        className="min-h-[88px]"
        icon={<ShoppingCart className="h-6 w-6" />}
      />
      <DashboardActionCard
        href="/dashboard/purchases/new"
        title="Nova Compra"
        description=""
        tone="green"
        className="min-h-[88px]"
        icon={<PackageSearch className="h-6 w-6" />}
      />
      <div className="col-span-2 sm:col-span-3 xl:col-span-3">
        <DashboardRegistrationsCard {...props} />
      </div>
    </section>
  )
}
