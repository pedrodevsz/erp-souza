"use client"

import { useState } from 'react'
import { Button, Input, Textarea } from '@/components/ui'

export type SalePaymentPayload = {
  amount: number
  date: string
  paymentMethod?: string
  notes?: string
}

type Props = {
  saleId: string
  onSubmit?: (saleId: string, payload: SalePaymentPayload) => Promise<boolean | void> | boolean | void
  onSuccess?: () => void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  disabled?: boolean
}

export function RegisterPaymentForm({
  saleId,
  onSubmit,
  onSuccess,
  onCancel,
  submitLabel = 'Registrar pagamento',
  cancelLabel = 'Cancelar',
  disabled = false,
}: Props) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setAmount('')
    setPaymentMethod('')
    setNotes('')
    setDate(new Date().toISOString().slice(0, 10))
  }

  const handleSubmit = async () => {
    if (!onSubmit || disabled || submitting) return

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return
    if (!date) return

    setSubmitting(true)
    try {
      const result = await onSubmit(saleId, {
        amount: numericAmount,
        date,
        paymentMethod: paymentMethod.trim(),
        notes: notes.trim(),
      })

      if (result === false) {
        return
      }

      resetForm()
      onSuccess?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Valor</label>
          <Input type="number" min={0} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={disabled || submitting} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Data</label>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={disabled || submitting} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Forma</label>
          <Input value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} placeholder="Opcional" disabled={disabled || submitting} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Observação</label>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" rows={3} disabled={disabled || submitting} />
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={disabled || submitting}>
            {cancelLabel}
          </Button>
        ) : null}
        <Button type="button" onClick={handleSubmit} disabled={disabled || submitting}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
