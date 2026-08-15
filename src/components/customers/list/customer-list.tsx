"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, MoreHorizontal, Pencil, ShoppingCart, Trash2 } from 'lucide-react'
import { useCustomers } from '@/hooks/customers/useCustomers'
import { PageHeader } from '@/components/page-header'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-provider'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { DataTableSection, EmptyStateAction, ListPageShell } from '@/components/shared'
import { PageLoading } from '@/components/shared/page-loading'
import { customerMessages, getFeedbackErrorMessage } from '@/lib/messages/feedback'
import { getPrimaryCustomerAddress } from '@/lib/customers/customers'
import { useCustomerStore } from '@/stores/customers/useCustomerStore'
import { useSales } from '@/hooks/sales/useSales'
import { CustomerOrdersSidebar } from '../view/customer-orders-sidebar'
import type { Customer } from '@/types/customer'
import { Badge } from '@/components/ui'

export function CustomersList() {
  const router = useRouter()
  const { customers, total, page, totalPages, setPage, loading, deleteCustomer, search, setSearch } = useCustomers()
  const { allSales, loading: salesLoading } = useSales()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [ordersPanelOpen, setOrdersPanelOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const renderValue = (value: string | null | undefined, fallback: string) => value?.trim() || fallback
  const selectedCustomerSales = useMemo(
    () => allSales.filter((sale) => sale.customerId === selectedCustomer?.id),
    [allSales, selectedCustomer?.id]
  )

  const customerSalesCount = useMemo(() => {
    const map = new Map<string, number>()
    allSales.forEach((sale) => {
      if (!sale.customerId) return
      map.set(sale.customerId, (map.get(sale.customerId) ?? 0) + 1)
    })
    return map
  }, [allSales])

  const onDelete = (id: string) => {
    setSelectedId(id)
    setConfirmOpen(true)
  }

  const openAv = (customer: Customer) => {
    setSelectedCustomer(customer)
    setOrdersPanelOpen(true)
  }

  const handleConfirm = async () => {
    if (!selectedId) return
    const removed = await deleteCustomer(selectedId)
    toast.push({
      title: removed ? 'Sucesso' : 'Erro',
      description: removed
        ? customerMessages.deleted
        : getFeedbackErrorMessage(useCustomerStore.getState().error, customerMessages.notFound),
      type: removed ? 'success' : 'error',
    })
    setConfirmOpen(false)
    setSelectedId(null)
  }

  const CustomerMobileCard = ({ customer }: { customer: Customer }) => {
    const address = getPrimaryCustomerAddress(customer)
    const salesCount = customerSalesCount.get(customer.id) ?? 0
    const houseNumber = renderValue(address.number, 'Não informado')

    return (
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="space-y-2 border-b border-slate-100 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate text-base font-semibold text-slate-900">{customer.name}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">{renderValue(customer.document, 'Documento não informado')}</p>
            </div>
            <Badge variant="neutral">{salesCount} venda(s)</Badge>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-3 p-4 text-sm">
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Telefone</p>
            <p className="mt-1 font-semibold text-slate-900">{renderValue(customer.phone, 'Não informado')}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Rua</p>
            <p className="mt-1 font-semibold text-slate-900">{renderValue(address.street, 'Não informado')}</p>
          </div>
          <div className="col-span-2 rounded-2xl bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Nº da casa</p>
            <p className="mt-1 font-semibold text-slate-900">{houseNumber}</p>
          </div>
        </CardContent>

        <CardFooter className="grid grid-cols-2 gap-2 px-4 pb-4">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/dashboard/customers/${customer.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-center">
                <MoreHorizontal className="h-4 w-4" />
                Mais ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={() => openAv(customer)}>
                <ShoppingCart className="h-4 w-4" />
                Pedidos do cliente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/customers/${customer.id}/edit`)}>
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(customer.id)}>
                <Trash2 className="h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div>
      <PageHeader title="Clientes" description="Listagem e gerenciamento de clientes." />

      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <ListPageShell
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome, documento, telefone ou e-mail"
          newHref="/dashboard/customers/new-client"
          newLabel="Novo Cliente"
          total={total}
          page={page}
          totalPages={totalPages}
          onPrevious={() => setPage(Math.max(1, page - 1))}
          onNext={() => setPage(Math.min(totalPages, page + 1))}
        >
          <div className="space-y-3 md:hidden">
            {loading ? (
              <PageLoading label="Carregando clientes..." className="min-h-[35vh]" />
            ) : customers.length === 0 ? (
              <EmptyStateAction
                title={search.trim() ? 'Nenhum cliente encontrado' : 'Sem clientes'}
                description={search.trim() ? `Nenhum resultado para “${search.trim()}”.` : 'Cadastre o primeiro cliente.'}
                actionLabel="Novo Cliente"
                href="/dashboard/customers/new-client"
              />
            ) : (
              customers.map((customer) => <CustomerMobileCard key={customer.id} customer={customer} />)
            )}
          </div>

          <div className="hidden md:block">
            <DataTableSection
            columns={[
              { header: 'Nome' },
              { header: 'CPF/CNPJ' },
              { header: 'Telefone' },
              { header: 'Cidade' },
              { header: 'Estado' },
              { header: 'Ações' },
            ]}
            rowCount={customers.length}
            colSpan={6}
            loading={loading}
            emptyContent={
              <EmptyStateAction
                title={search.trim() ? 'Sem resultado' : 'Sem clientes'}
                description={search.trim() ? 'Ajuste a busca.' : 'Cadastre o primeiro cliente.'}
                actionLabel="Novo Cliente"
                href="/dashboard/customers/new-client"
              />
            }
          >
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="p-2 align-middle">{c.name}</td>
                <td className="p-2 align-middle">{renderValue(c.document, 'Não informado')}</td>
                <td className="p-2 align-middle">{renderValue(c.phone, 'Não informado')}</td>
                <td className="p-2 align-middle">{renderValue(getPrimaryCustomerAddress(c).city, 'Não informado')}</td>
                <td className="p-2 align-middle">{renderValue(getPrimaryCustomerAddress(c).state, 'Não informado')}</td>
                <td className="p-2 align-middle">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 rounded-full px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        Ações
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuItem onClick={() => openAv(c)}>
                        <ShoppingCart className="h-4 w-4" />
                        Pedidos do cliente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/customers/${c.id}/edit`)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete(c.id)}>
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            </DataTableSection>
          </div>
        </ListPageShell>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir cliente"
        description="Tem certeza que deseja excluir este cliente? Esta ação não poderá ser desfeita."
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      {selectedCustomer && (
        <CustomerOrdersSidebar
          customerName={selectedCustomer.name}
          sales={selectedCustomerSales}
          open={ordersPanelOpen}
          onOpenChange={setOrdersPanelOpen}
          loading={salesLoading}
        />
      )}
    </div>
  )
}
