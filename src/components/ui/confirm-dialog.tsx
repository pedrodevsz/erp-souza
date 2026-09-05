"use client"

import React from 'react'
import { Button } from './button'

type Props = {
    open: boolean
    title?: string
    description?: string
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({ open, title = 'Confirmação', description, onConfirm, onCancel }: Props) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
            <div className="bg-white rounded-md shadow-lg z-10 w-full max-w-md p-6">
                <h3 className="text-lg font-semibold">{title}</h3>
                {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
                <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button type="button" variant="destructive" onClick={onConfirm}>Excluir</Button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
