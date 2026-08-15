"use client"

import { Button } from '@/components/ui'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

type Props = {
  id: string
}

export function InventoryActions({ id }: Props) {
  const router = useRouter()

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => router.push(`/dashboard/stock/${id}/edit`)}>
          Editar
        </Button>
        <Button onClick={() => router.back()} variant="outline">
          Voltar
        </Button>
      </div>
    </Card>
  )
}
