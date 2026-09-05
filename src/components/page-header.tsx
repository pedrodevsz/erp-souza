"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type Props = {
  title?: string
  description?: string
}

const nameMap: Record<string, string> = {
  clients: 'Clientes',
  customers: 'Clientes',
  products: 'Produtos',
  sales: 'Vendas',
  purchases: 'Compras',
  stock: 'Estoque',
  finance: 'Financeiro',
  suppliers: 'Fornecedores',
  deliveries: 'Entregas',
  users: 'Usuários',
  settings: 'Configurações',
  dashboard: 'Dashboard',
  new: 'Cadastrar',
  'new-client': 'Novo Cliente',
  edit: 'Editar',
  view: 'Visualizar',
}

function titleize(segment: string) {
  return nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function PageHeader({ title, description }: Props) {
  const pathname = usePathname() || '/'

  const parts = pathname.split('/').filter(Boolean)

  const breadcrumb = parts.map((p, idx) => ({
    label: titleize(p),
    href: '/' + parts.slice(0, idx + 1).join('/'),
  }))

  const displayTitle = title || (breadcrumb.length ? breadcrumb[breadcrumb.length - 1].label : 'Dashboard')

  return (
    <header className="mb-4 sm:mb-6">
      <div className="mb-2 text-sm text-muted-foreground">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-xs sm:text-sm">
            {breadcrumb.map((b, i) => {
              const last = i === breadcrumb.length - 1
              return (
                <li key={b.href} className="flex items-center">
                  {!last ? (
                    <Link href={b.href} className="text-xs text-gray-500 hover:text-blue-600 sm:text-sm">{b.label}</Link>
                  ) : (
                    <span className="text-xs font-medium text-blue-600 sm:text-sm">{b.label}</span>
                  )}
                  {i < breadcrumb.length - 1 && <span className="mx-2 text-gray-300">/</span>}
                </li>
              )
            })}
          </ol>
        </nav>
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight text-gray-800 sm:text-2xl lg:text-3xl">{displayTitle}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </header>
  )
}
