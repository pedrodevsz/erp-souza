"use client"

import React, { createContext, useContext } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

type DialogContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
        {children}
      </div>
    </DialogContext.Provider>
  )
}

type DialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
}

export function DialogContent({ className = '', children, ...props }: DialogContentProps) {
  return (
    <div
      className={cn('relative z-10 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 space-y-1', className)} {...props} />
}

export function DialogTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-slate-900', className)} {...props} />
}

export function DialogDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-600', className)} {...props} />
}

export function DialogFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />
}

export function DialogClose({ children = 'Fechar' }: { children?: React.ReactNode }) {
  const context = useContext(DialogContext)

  if (!context) return null

  return (
    <Button type="button" className="border border-slate-200 bg-white text-slate-700" onClick={() => context.onOpenChange(false)}>
      {children}
    </Button>
  )
}
