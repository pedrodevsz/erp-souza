"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: string; title?: string; description?: string; type?: 'success' | 'error' }

type ContextType = {
    toasts: Toast[]
    push: (t: Omit<Toast, 'id'>) => void
    remove: (id: string) => void
}

const ToastContext = createContext<ContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const push = useCallback((t: Omit<Toast, 'id'>) => {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        const toast = { id, ...t }
        setToasts((s) => [...s, toast])
        setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4000)
    }, [])

    const remove = useCallback((id: string) => setToasts((s) => s.filter((t) => t.id !== id)), [])

    return (
        <ToastContext.Provider value={{ toasts, push, remove }}>
            {children}
            <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
                {toasts.map((t) => (
                    <div key={t.id} className={`min-w-[240px] rounded-md p-3 shadow ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-sky-600 text-white'}`}>
                        <div className="font-semibold">{t.title}</div>
                        {t.description && <div className="text-sm">{t.description}</div>}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}
