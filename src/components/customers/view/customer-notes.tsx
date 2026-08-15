"use client"

import { SectionCard } from '@/components/shared'

type Props = {
    notes: string | null | undefined
}

export function CustomerNotes({ notes }: Props) {
    return (
        <SectionCard title="Observações">
            <p className="text-gray-700">{notes && notes.trim() ? notes : 'Não informado'}</p>
        </SectionCard>
    )
}
