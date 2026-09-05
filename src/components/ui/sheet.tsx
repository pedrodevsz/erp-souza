"use client"

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type SheetContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = createContext<SheetContextValue | null>(null)

type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return <SheetContext.Provider value={{ open, onOpenChange }}>{children}</SheetContext.Provider>
}

type SheetContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: 'right'
}

export function SheetContent({ className = '', children, ...props }: SheetContentProps) {
  const context = useContext(SheetContext)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!context?.open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        context.onOpenChange(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [context])

  if (!context?.open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fechar painel"
        className="absolute inset-0 bg-black/40"
        onClick={() => context.onOpenChange(false)}
      />
      <aside
        className={cn(
          'absolute right-0 top-0 h-full w-[85vw] max-w-[22rem] border-l border-slate-200 bg-background shadow-2xl',
          className
        )}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => context.onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Fechar painel"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="h-full overflow-y-auto">{children}</div>
      </aside>
    </div>,
    document.body
  )
}

export function SheetHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-slate-100 px-6 py-5 pr-14', className)} {...props} />
}

export function SheetTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold text-slate-900', className)} {...props} />
}

export function SheetDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-slate-500', className)} {...props} />
}

export default Sheet
