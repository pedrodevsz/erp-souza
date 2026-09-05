"use client"

import { Badge } from '@/components/ui'
import { DefinitionList, SectionCard } from '@/components/shared'
import { Address } from '@/types/customer'

type Props = {
    addresses: Address[]
}

export function CustomerAddress({ addresses }: Props) {
    return (
        <SectionCard title="Endereços" description="Um cliente pode ter mais de um endereço cadastrado.">
            <div className="space-y-3">
                {addresses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        Sem endereço cadastrado.
                    </div>
                ) : (
                    addresses.map((address, index) => (
                        <div key={`${address.zipCode}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <Badge variant="neutral">Endereço {index + 1}</Badge>
                                {address.city || address.state ? (
                                    <span className="text-xs text-slate-500">{[address.city, address.state].filter(Boolean).join('/')}</span>
                                ) : null}
                            </div>
                            <DefinitionList
                                columns={2}
                                items={[
                                    { label: 'CEP', value: address.zipCode, hidden: !address.zipCode?.trim() },
                                    { label: 'Rua', value: address.street, hidden: !address.street?.trim() },
                                    { label: 'Número', value: address.number, hidden: !address.number?.trim() },
                                    { label: 'Complemento', value: address.complement, hidden: !address.complement?.trim() },
                                    { label: 'Bairro', value: address.district, hidden: !address.district?.trim() },
                                    { label: 'Cidade', value: address.city, hidden: !address.city?.trim() },
                                    { label: 'Estado', value: address.state, hidden: !address.state?.trim() },
                                ]}
                            />
                        </div>
                    ))
                )}
            </div>
        </SectionCard>
    )
}
