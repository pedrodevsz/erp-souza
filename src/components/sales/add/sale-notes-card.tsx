"use client"

import { Textarea } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  notes: string
  onNotesChange: (value: string) => void
}

export function SaleNotesCard({ notes, onNotesChange }: Props) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Observações</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          placeholder="Informações adicionais sobre a venda..."
        />
      </CardContent>
    </Card>
  )
}
