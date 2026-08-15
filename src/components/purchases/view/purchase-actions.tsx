"use client"

import { SectionCard } from '@/components/shared'
import { Button } from '@/components/ui'
import { useRouter } from 'next/navigation'

type Props = {
    purchaseId: string
}

export function PurchaseActions({ purchaseId }: Props) {
    const router = useRouter()

    return (
        <SectionCard title="Ações">
            <div className="flex flex-wrap gap-2">
                <Button onClick={() => router.push(`/dashboard/purchases/${purchaseId}/edit`)}>
                    Editar
                </Button>
                <Button onClick={() => router.back()} variant="outline">
                    Voltar
                </Button>
            </div>
        </SectionCard>
    )
}
