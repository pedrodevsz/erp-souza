"use client"

import type { ComponentType } from 'react'
import { FileUp, PenSquare, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ChoiceCard({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:bg-sky-50/50"
    >
      <div className="rounded-xl bg-sky-100 p-3 text-sky-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-base font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-sm text-slate-500">{description}</div>
      </div>
    </button>
  )
}

export function NewPurchaseMethodModal({ open, onOpenChange }: Props) {
  const router = useRouter()

  const closeAndNavigate = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-slate-200 bg-gradient-to-b from-white to-slate-50 p-0">
        <div className="p-6">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle>Nova compra</DialogTitle>
                <DialogDescription>Escolha como quer iniciar o cadastro da compra.</DialogDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Fechar modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <ChoiceCard
              title="Preencher manualmente"
              description="Abre o formulário atual de compras, sem alterações no fluxo existente."
              icon={PenSquare}
              onClick={() => closeAndNavigate('/dashboard/purchases/new')}
            />

            <ChoiceCard
              title="Importar nota fiscal"
              description="Envie PDF, JPG, JPEG ou PNG para preencher o formulário automaticamente."
              icon={FileUp}
              onClick={() => closeAndNavigate('/dashboard/purchases/import-invoice')}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
