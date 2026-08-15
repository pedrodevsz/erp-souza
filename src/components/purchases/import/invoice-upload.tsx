"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, FileImage, FileText, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { Button, Input } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/shared/page-loading'
import { useToast } from '@/components/ui/toast-provider'
import { formatPurchaseInvoiceFileSize, getPurchaseInvoiceFileExtension, isAllowedPurchaseInvoiceExtension, isAllowedPurchaseInvoiceMimeType, MAX_PURCHASE_INVOICE_UPLOAD_BYTES } from '@/lib/purchase-invoice'
import { importPurchaseInvoice, PurchaseApiError } from '@/lib/purchases-api'
import { summarizePurchaseImportPayload } from '@/lib/purchase-import-extraction'
import { usePurchaseImportStore } from '@/stores/purchases/usePurchaseImportStore'
import { getFeedbackErrorMessage } from '@/lib/messages/feedback'

function getPreviewKind(file: File) {
  return file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'unknown'
}

function validateFile(file: File) {
  const extension = getPurchaseInvoiceFileExtension(file.name)

  if (!file.size) return 'O arquivo está vazio.'
  if (file.size > MAX_PURCHASE_INVOICE_UPLOAD_BYTES) return 'Arquivo muito grande. Envie um arquivo de até 10 MB.'
  if (!isAllowedPurchaseInvoiceExtension(extension)) return 'Formato não permitido. Use PDF, JPG, JPEG ou PNG.'
  if (!file.type || !isAllowedPurchaseInvoiceMimeType(file.type)) return 'MIME type inválido.'

  return null
}

export function InvoiceUpload() {
  const router = useRouter()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const setImportResult = usePurchaseImportStore((s) => s.setImportResult)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const selectFile = (nextFile: File | null) => {
    setError(null)
    if (!nextFile) {
      setFile(null)
      return
    }

    const validationError = validateFile(nextFile)
    if (validationError) {
      setFile(null)
      setError(validationError)
      return
    }

    setFile(nextFile)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer.files[0]) {
      selectFile(event.dataTransfer.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Selecione um arquivo antes de continuar.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await importPurchaseInvoice(file)
      if (process.env.NODE_ENV !== 'production') {
        console.info('[import-invoice] frontend-received', {
          status: result.status,
          summary: result.summary,
          ...summarizePurchaseImportPayload(result.purchase),
        })
      }

      setImportResult(result)
      toast.push({
        title: result.status === 'ready_for_review' ? 'Importação concluída' : 'Importação concluída com revisão',
        description: 'A nota fiscal foi interpretada e o formulário foi preenchido.',
        type: 'success',
      })
      if (process.env.NODE_ENV !== 'production') {
        console.info('[import-invoice] navigation-payload', {
          status: result.status,
          ...summarizePurchaseImportPayload(result.purchase),
        })
      }
      router.push('/dashboard/purchases/new')
    } catch (err) {
      if (err instanceof PurchaseApiError) {
        setError(err.message)
        return
      }

      if (err instanceof Error && err.name === 'AbortError') {
        setError('A importação da nota foi cancelada.')
        return
      }

      setError(getFeedbackErrorMessage(err instanceof Error ? err.message : null, 'Não foi possível importar a nota fiscal.'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoading label="Analisando nota fiscal..." />
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-sm font-semibold text-sky-600">Importar nota fiscal</CardTitle>
          <p className="text-sm text-slate-500">
            Envie um PDF ou uma imagem legível. A compra não será salva automaticamente.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div
            className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-sky-300 hover:bg-sky-50/50"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-10 w-10 text-sky-600" />
            <div className="mt-3 text-sm font-semibold text-slate-900">Arraste e solte o arquivo aqui</div>
            <div className="mt-1 text-sm text-slate-500">ou selecione um PDF, JPG, JPEG ou PNG</div>
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Selecionar arquivo
              </Button>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
          </div>

          {file ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {getPreviewKind(file) === 'image' ? <FileImage className="mt-0.5 h-5 w-5 text-sky-600" /> : <FileText className="mt-0.5 h-5 w-5 text-sky-600" />}
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{file.name}</div>
                    <div className="text-xs text-slate-500">
                      {formatPurchaseInvoiceFileSize(file.size)} • {file.type || 'tipo desconhecido'}
                    </div>
                  </div>
                </div>

                <Button type="button" variant="ghost" size="icon" onClick={() => selectFile(null)} aria-label="Remover arquivo">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {previewUrl ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <Image src={previewUrl} alt="Pré-visualização da nota" width={1200} height={800} unoptimized className="max-h-[420px] w-full object-contain" />
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertTriangle className="mr-2 inline-block h-4 w-4" />
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/purchases')}>
              Voltar
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!file || loading}>
              Importar e revisar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
