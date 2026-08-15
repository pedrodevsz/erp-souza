"use client"

import { Button } from '@/components/ui'
import { useFormContext } from 'react-hook-form'

type Props = {
    onCancel?: () => void
    submitLabel?: string
    submitMode?: 'submit' | 'button'
    onSubmitClick?: () => void
}

export function CustomerFormActions({ onCancel, submitLabel = 'Salvar Cliente', submitMode = 'submit', onSubmitClick }: Props) {
    const { reset, formState: { isSubmitting } } = useFormContext()

    const handleCancel = () => {
        reset()
        onCancel?.()
    }

    return (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                Cancelar
            </Button>
            <Button
                type={submitMode === 'button' ? 'button' : 'submit'}
                onClick={submitMode === 'button' ? onSubmitClick : undefined}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
            >
                {submitLabel}
            </Button>
        </div>
    )
}
