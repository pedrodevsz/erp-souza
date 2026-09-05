"use client"

import React from 'react'
import { CreateButton } from './index'
import { Search } from 'lucide-react'

type Props = {
    value?: string
    onChange?: (s: string) => void
    placeholder?: string
    newHref?: string
    newLabel?: string
    className?: string
    prefix?: React.ReactNode
    extraButton?: React.ReactNode
}

export function FilterBar({ value = '', onChange = () => { }, placeholder = 'Buscar...', newHref, newLabel = 'Novo', className = '', prefix, extraButton = null }: Props) {
    const defaultIcon = <Search size={14} />
    return (
        <div className={`mb-4 flex flex-col gap-3 sm:flex-row sm:items-center ${className}`}>
            <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-slate-600">
                {prefix ?? defaultIcon}
            </div>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="min-w-0 w-full rounded-md border px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2 sm:shrink-0">
                {newHref && <CreateButton href={newHref} name={newLabel} className="w-full sm:w-auto" />}
                {extraButton}
            </div>
        </div>
    )
}

export default FilterBar
