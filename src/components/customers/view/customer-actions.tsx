"use client"

import { SectionCard } from '@/components/shared'
import { Button } from '@/components/ui'
import { useRouter } from 'next/navigation'

type Props = {
    customerId: string
}

export function CustomerActions({ customerId }: Props) {
    const router = useRouter()

    return (
        <SectionCard title="Ações">
            <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => router.push(`/dashboard/customers/${customerId}/edit`)} className="w-full sm:w-auto">
                    Editar
                </Button>
                <Button onClick={() => router.back()} variant="outline" className="w-full sm:w-auto">
                    Voltar
                </Button>
            </div>
        </SectionCard>
    )
}
