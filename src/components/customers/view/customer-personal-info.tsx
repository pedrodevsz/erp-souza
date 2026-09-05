"use client"

import { DefinitionList } from '@/components/shared'
import { SectionCard } from '@/components/shared'

type Props = {
    name: string
    document: string
    phone: string
}

function renderPersonalValue(value: string | null | undefined, fallback: string) {
    return value?.trim() || fallback
}

export function CustomerPersonalInfo({ name, document, phone }: Props) {
    return (
        <SectionCard title="Dados Pessoais">
            <DefinitionList
                items={[
                    { label: 'Nome', value: name },
                    { label: 'Documento', value: renderPersonalValue(document, 'Sem documento informado') },
                    { label: 'Telefone', value: renderPersonalValue(phone, 'Sem telefone informado') },
                ]}
            />
        </SectionCard>
    )
}
