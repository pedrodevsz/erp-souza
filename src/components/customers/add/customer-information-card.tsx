"use client"

import { Label, Input } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { useFormContext } from 'react-hook-form'

export function CustomerInformationCard() {
    const { register, formState: { errors } } = useFormContext()

    return (
        <Card>
            <CardHeader className="mb-2 flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-sky-600">Dados pessoais</CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <Label>Nome completo *</Label>
                    <Input {...register('fullName')} placeholder="Ex.: João da Silva" />
                    {errors.fullName && <p className="text-sm text-red-600">{String(errors.fullName.message)}</p>}
                </div>

                <div>
                    <Label>CPF / CNPJ</Label>
                    <Input {...register('document')} placeholder="Opcional: 123.456.789-00" />
                    {errors.document && <p className="text-sm text-red-600">{String(errors.document.message)}</p>}
                </div>

                <div>
                    <Label>Telefone</Label>
                    <Input {...register('phone')} type="tel" inputMode="tel" placeholder="Ex.: (11) 99999-9999" />
                    {errors.phone && <p className="text-sm text-red-600">{String(errors.phone.message)}</p>}
                </div>

            </CardContent>
        </Card>
    )
}
