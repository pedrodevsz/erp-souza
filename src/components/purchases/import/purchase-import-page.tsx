"use client"

import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { InvoiceUpload } from './invoice-upload'

export function PurchaseImportPage() {
  return (
    <ToastProvider>
      <div>
        <PageHeader title="Importar nota fiscal" description="Use a OpenAI apenas para preencher o formulário existente." />
        <InvoiceUpload />
      </div>
    </ToastProvider>
  )
}
