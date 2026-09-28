"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { ToastProvider } from '@/components/ui/toast-provider'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PURCHASE_IMPORT_UNAVAILABLE_MESSAGE, PURCHASE_MANUAL_ROUTE } from '@/lib/purchase-import'

function PurchaseImportUnavailableRedirect() {
  const router = useRouter()

  useEffect(() => {
    const timeout = window.setTimeout(() => router.replace(PURCHASE_MANUAL_ROUTE), 1200)
    return () => window.clearTimeout(timeout)
  }, [router])

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-base text-amber-900">Importação indisponível</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800">
          {PURCHASE_IMPORT_UNAVAILABLE_MESSAGE}
        </CardContent>
      </Card>
    </div>
  )
}

export function PurchaseImportPage() {
  return (
    <ToastProvider>
      <div>
        <PageHeader title="Importar nota fiscal" description="Esta entrada está temporariamente indisponível." />
        <PurchaseImportUnavailableRedirect />
      </div>
    </ToastProvider>
  )
}
