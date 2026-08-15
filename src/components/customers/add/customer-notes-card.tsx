"use client"

import { Textarea } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { useFormContext } from 'react-hook-form'

export function CustomerNotesCard() {
    const { register, formState: { errors } } = useFormContext()

    return (
        <Card>
            <CardHeader className="mb-2 flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-sky-600">Observações</CardTitle>
            </CardHeader>

            <CardContent>
                <Textarea {...register('notes')} rows={4} placeholder="Informações adicionais sobre o cliente..." />
                {errors.notes && <p className="text-sm text-red-600">{String(errors.notes.message)}</p>}
            </CardContent>
        </Card>
    )
}
