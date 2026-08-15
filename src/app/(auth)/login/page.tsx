"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole, LogIn, Shield, Sparkles } from 'lucide-react'

import { AuthService } from '@/services/authService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Button } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedPassword = password.trim()
    if (!trimmedName) {
      setError('Informe seu nome de usuário.')
      return
    }

    if (!trimmedPassword) {
      setError('Informe sua senha numérica.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await AuthService.login(trimmedName, trimmedPassword)
      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível entrar no sistema.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_44%),linear-gradient(180deg,_#f8fbff_0%,_#eef6fb_100%)] px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between rounded-[32px] border border-sky-100 bg-white/80 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
              <Sparkles className="h-4 w-4" />
              Acesso controlado
            </div>

            <div className="space-y-3">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Entrar no sistema com senha numérica
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-600">
                O acesso é liberado apenas para usuários cadastrados pelo administrador. Sem cadastro público e sem senha em texto puro.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Shield className="h-5 w-5 text-sky-600" />
              <p className="mt-3 text-sm font-medium text-slate-900">Sessão protegida</p>
              <p className="mt-1 text-sm text-slate-500">Cookie assinado e httpOnly.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <LockKeyhole className="h-5 w-5 text-sky-600" />
              <p className="mt-3 text-sm font-medium text-slate-900">Senha única</p>
              <p className="mt-1 text-sm text-slate-500">Cada usuário usa sua própria senha numérica.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <LogIn className="h-5 w-5 text-sky-600" />
              <p className="mt-3 text-sm font-medium text-slate-900">Acesso rápido</p>
              <p className="mt-1 text-sm text-slate-500">Um único campo para entrar no sistema.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <Card className="w-full border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-slate-900">Login</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Entre com o nome de usuário e a senha cadastrados pelo administrador.
                </CardDescription>
              </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Usuário
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Digite seu usuário"
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Senha numérica
                  </label>
                  <Input
                    id="password"
                    type="password"
                    inputMode="numeric"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite apenas números"
                    autoComplete="current-password"
                  />
                </div>

                {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  <LogIn className="h-4 w-4" />
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
