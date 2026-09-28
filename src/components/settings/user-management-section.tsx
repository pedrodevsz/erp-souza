"use client"

import { useEffect, useState } from 'react'
import { KeyRound, Plus, ShieldCheck, UserRound } from 'lucide-react'

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { UserApi, UserApiError } from '@/lib/users/users-api'
import type { UserDTO } from '@/server/models/users/users.model'

function formatDate(value: string | null) {
  if (!value) return 'Data não disponível'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Data não disponível' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

export function UserManagementSection() {
  const [users, setUsers] = useState<UserDTO[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [resetPassword, setResetPassword] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      setUsers(await UserApi.list())
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadInitialUsers = async () => {
      await loadUsers()
    }

    void loadInitialUsers()
  }, [])

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      await UserApi.create({ username, password })
      setUsername('')
      setPassword('')
      setMessage('Usuário criado com sucesso.')
      await loadUsers()
    } catch (cause) {
      setError(cause instanceof UserApiError ? cause.message : 'Não foi possível criar o usuário.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (user: UserDTO) => {
    setError(null)
    try {
      await UserApi.update(user.id, { isActive: !user.isActive })
      await loadUsers()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o usuário.')
    }
  }

  const handlePassword = async (user: UserDTO) => {
    const nextPassword = resetPassword[user.id] ?? ''
    if (!nextPassword) return

    setError(null)
    try {
      await UserApi.update(user.id, { password: nextPassword })
      setResetPassword((current) => ({ ...current, [user.id]: '' }))
      setMessage(`Senha de ${user.username} alterada.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível alterar a senha.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Usuários</h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie somente usuários USER. A criação de ADMIN permanece fora deste painel.</p>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Novo USER</CardTitle>
          <CardDescription>O backend força role USER e valida senha entre 8 e 128 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Username
              <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Ex.: loja souza" autoComplete="username" required />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Senha
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 a 128 caracteres" autoComplete="new-password" minLength={8} maxLength={128} required />
            </label>
            <Button type="submit" disabled={submitting}>{submitting ? 'Criando...' : 'Criar USER'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contas cadastradas</CardTitle>
          <CardDescription>{loading ? 'Carregando...' : `${users.length} usuário(s)`}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Criado em</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell><Badge variant={user.role === 'ADMIN' ? 'info' : 'neutral'}>{user.role === 'ADMIN' ? <ShieldCheck className="mr-1 inline h-3 w-3" /> : <UserRound className="mr-1 inline h-3 w-3" />}{user.role}</Badge></TableCell>
                  <TableCell><Badge variant={user.isActive ? 'success' : 'neutral'}>{user.isActive ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="min-w-72 text-right">
                    {user.role === 'USER' && <div className="flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={() => void handleToggle(user)}>{user.isActive ? 'Desativar' : 'Ativar'}</Button><Input className="w-44" type="password" placeholder="Nova senha" value={resetPassword[user.id] ?? ''} onChange={(event) => setResetPassword((current) => ({ ...current, [user.id]: event.target.value }))} minLength={8} maxLength={128} /><Button type="button" variant="outline" size="sm" onClick={() => void handlePassword(user)}><KeyRound className="mr-1 h-3 w-3" />Salvar</Button></div>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
