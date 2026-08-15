"use client"

import { Download, Printer, X } from 'lucide-react'

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui'
import type { Sale } from '@/types/sale'

import { SaleReceipt, printSaleReceiptDocument } from './sale-receipt'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: Sale | null
}

export function SaleCompletedDialog({ open, onOpenChange, sale }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[860px] overflow-hidden bg-slate-100 p-0">
        <div className="flex max-h-[92vh] flex-col">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-xl text-slate-900">Venda concluída</DialogTitle>
                <DialogDescription>A venda foi salva com sucesso. Use as ações abaixo para imprimir ou exportar em PDF.</DialogDescription>
              </div>

              <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Fechar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {sale ? (
              <SaleReceipt sale={sale} />
            ) : (
              <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white px-6 text-center text-sm text-slate-500">
                Nenhuma venda foi carregada para exibição.
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              {sale ? (
                <>
                  <Button type="button" variant="outline" onClick={() => printSaleReceiptDocument(sale)}>
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                  <Button type="button" onClick={() => printSaleReceiptDocument(sale)}>
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                </>
              ) : null}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
