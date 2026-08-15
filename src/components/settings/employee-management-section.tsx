"use client"

import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Shield, Trash2 } from 'lucide-react'
import { AlertDialog, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { useToast } from '@/components/ui/toast-provider'
import { useEmployees } from '@/hooks/employees/useEmployees'
import { DEFAULT_EMPLOYEE_ROLE, EMPLOYEE_ROLES, isEmployeeRole, type EmployeeRole } from '@/lib/employees/employee-roles'
import { employeeMessages, getFeedbackErrorMessage } from '@/lib/messages/feedback'
import { PageLoading } from '@/components/shared/page-loading'
import type { Employee } from '@/types/employee'

function formatPhone(value?: string | null) {
  const phone = value?.trim()
  return phone ? phone : 'Não informado'
}

function getStatusVariant(active: boolean) {
  return active ? 'success' : 'neutral'
}

function getRoleLabel(role: string) {
  return isEmployeeRole(role) ? role : DEFAULT_EMPLOYEE_ROLE
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeManagementDialog({ open, onOpenChange }: Props) {
  const toast = useToast()
  const {
    employees,
    allEmployees,
    loading,
    error,
    search,
    currentPage,
    totalPages,
    total,
    loadEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    selectEmployee,
    clearSelectedEmployee,
    setSearch,
    setPage,
  } = useEmployees()
  const [name, setName] = useState('')
  const [role, setRole] = useState<EmployeeRole>(DEFAULT_EMPLOYEE_ROLE)
  const [phone, setPhone] = useState('')
  const [active, setActive] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null)

  const isInitialLoading = loading && allEmployees.length === 0
  const activeCount = useMemo(() => allEmployees.filter((employee) => employee.active).length, [allEmployees])
  const editingEmployee = useMemo(() => allEmployees.find((employee) => employee.id === editingEmployeeId) ?? null, [allEmployees, editingEmployeeId])

  const resetForm = () => {
    setEditingEmployeeId(null)
    setName('')
    setRole(DEFAULT_EMPLOYEE_ROLE)
    setPhone('')
    setActive(true)
    clearSelectedEmployee()
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployeeId(employee.id)
    selectEmployee(employee.id)
    setName(employee.name)
    setRole(employee.role)
    setPhone(employee.phone ?? '')
    setActive(employee.active)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.push({ title: 'Erro', description: 'Nome do funcionário é obrigatório.', type: 'error' })
      return
    }

    try {
      if (editingEmployeeId) {
        const updated = await updateEmployee(editingEmployeeId, {
          name: trimmedName,
          role,
          phone: phone.trim() || undefined,
          active,
        })

        if (updated) {
          toast.push({ title: 'Sucesso', description: employeeMessages.updated, type: 'success' })
        }
      } else {
        await createEmployee({
          name: trimmedName,
          role,
          phone: phone.trim() || undefined,
          active,
        })
        toast.push({ title: 'Sucesso', description: employeeMessages.created, type: 'success' })
      }

      resetForm()
    } catch (error) {
      toast.push({
        title: 'Erro',
        description: getFeedbackErrorMessage(error instanceof Error ? error.message : null, employeeMessages.error),
        type: 'error',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const deleted = await deleteEmployee(deleteTarget.id)
      if (deleted) {
        toast.push({ title: 'Sucesso', description: employeeMessages.deleted, type: 'success' })
      }

      if (editingEmployeeId === deleteTarget.id) {
        resetForm()
      }

      setDeleteTarget(null)
    } catch (error) {
      toast.push({
        title: 'Erro',
        description: getFeedbackErrorMessage(error instanceof Error ? error.message : null, employeeMessages.error),
        type: 'error',
      })
    }
  }

  const handleToggleStatus = async (employee: Employee) => {
    try {
      const updated = await toggleEmployeeStatus(employee.id)
      if (updated) {
        toast.push({
          title: 'Sucesso',
          description: updated.active ? 'Funcionário ativado com sucesso.' : 'Funcionário desativado com sucesso.',
          type: 'success',
        })
      }
    } catch (error) {
      toast.push({
        title: 'Erro',
        description: getFeedbackErrorMessage(error instanceof Error ? error.message : null, employeeMessages.error),
        type: 'error',
      })
    }
  }

  if (isInitialLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar funcionários</DialogTitle>
            <DialogDescription>Cadastre, edite e organize os funcionários da empresa.</DialogDescription>
          </DialogHeader>
          <PageLoading label="Carregando funcionários..." className="min-h-[28rem]" />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar funcionários</DialogTitle>
          <DialogDescription>Cadastre, edite e organize os funcionários da empresa.</DialogDescription>
        </DialogHeader>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Funcionários</h2>
                {editingEmployeeId && <Badge variant="info">Editando</Badge>}
                {loading && <Badge variant="neutral">Atualizando</Badge>}
              </div>
              <p className="text-sm text-slate-500">
                Cadastre, edite e organize os funcionários que aparecem nas vendas e nas rotinas internas do sistema.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{total}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Ativos</p>
                <p className="mt-1 text-lg font-semibold text-emerald-700">{activeCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Página</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {currentPage}/{totalPages}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:p-6">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-base font-semibold text-slate-900">Lista de funcionários</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  {employees.length === 0 && !search.trim()
                    ? 'Nenhum funcionário cadastrado ainda.'
                    : 'Nome, cargo, status e ações rápidas para cada registro.'}
                </CardDescription>
              </div>

              <div className="pt-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nome, cargo ou telefone"
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-medium">Erro ao carregar funcionários.</p>
                  <p className="mt-1">{error}</p>
                  <Button type="button" variant="outline" className="mt-3" onClick={() => void loadEmployees()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : employees.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                  <Shield className="h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-base font-semibold text-slate-900">
                    {search.trim() ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {search.trim()
                      ? 'Tente outro termo ou limpe a busca para ver todos os registros.'
                      : 'Use o formulário ao lado para cadastrar o primeiro funcionário.'}
                  </p>
                  {search.trim() && (
                    <Button type="button" variant="outline" className="mt-4" onClick={() => setSearch('')}>
                      Limpar busca
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-slate-200">
                          <TableHead>Nome</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map((employee) => (
                          <TableRow key={employee.id} className="border-slate-100">
                            <TableCell>
                              <div className="space-y-0.5">
                                <p className="font-medium text-slate-900">{employee.name}</p>
                                <p className="text-xs text-slate-500">{formatPhone(employee.phone)}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">{getRoleLabel(employee.role)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(employee.active)}>{employee.active ? 'Ativo' : 'Inativo'}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => handleEdit(employee)} disabled={loading}>
                                  <Pencil className="h-3.5 w-3.5" />
                                  Editar
                                </Button>
                                <Button type="button" size="sm" variant="secondary" className="gap-2" onClick={() => void handleToggleStatus(employee)} disabled={loading}>
                                  <Shield className="h-3.5 w-3.5" />
                                  {employee.active ? 'Desativar' : 'Ativar'}
                                </Button>
                                <Button type="button" size="sm" variant="destructive" className="gap-2" onClick={() => setDeleteTarget(employee)} disabled={loading}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Excluir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Página {currentPage} de {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1 || loading}
                        onClick={() => setPage(Math.max(1, currentPage - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages || loading}
                        onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-4">
              <CardTitle className="text-base font-semibold text-slate-900">
                {editingEmployeeId ? 'Editar funcionário' : 'Novo funcionário'}
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                {editingEmployeeId
                  ? 'Atualize cargo, telefone e status do funcionário selecionado.'
                  : 'Cadastre um novo funcionário para usar no sistema.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nome *</label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: João Silva" disabled={loading} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Cargo *</label>
                  <Select value={role} onChange={(event) => setRole(event.target.value as EmployeeRole)} disabled={loading}>
                    {EMPLOYEE_ROLES.map((employeeRole) => (
                      <option key={employeeRole} value={employeeRole}>
                        {employeeRole}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Telefone</label>
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ex.: (99) 99999-9999" disabled={loading} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status *</label>
                  <Select value={active ? 'active' : 'inactive'} onChange={(event) => setActive(event.target.value === 'active')} disabled={loading}>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </Select>
                </div>

                {editingEmployee && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Editando <span className="font-medium text-slate-900">{editingEmployee.name}</span>.
                  </div>
                )}

                <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                  {editingEmployeeId ? (
                    <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                      Cancelar edição
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                      Limpar
                    </Button>
                  )}
                  <Button type="submit" className="gap-2" disabled={loading}>
                    <Plus className="h-4 w-4" />
                    {editingEmployeeId ? 'Atualizar funcionário' : 'Salvar funcionário'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <AlertDialog
        open={Boolean(deleteTarget)}
        title="Excluir funcionário"
        description="Tem certeza que deseja excluir este funcionário? Esta ação não poderá ser desfeita."
        confirmLabel="Excluir"
        confirmTone="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      </DialogContent>
    </Dialog>
  )
}

export { EmployeeManagementDialog as EmployeeManagementSection }
