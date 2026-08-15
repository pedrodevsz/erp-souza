"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'

type CollapsibleContextValue = {
  open: boolean
  toggle: () => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

type CollapsibleProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function Collapsible({ open, onOpenChange, children, className }: CollapsibleProps) {
  const toggle = React.useCallback(() => onOpenChange(!open), [onOpenChange, open])

  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      <div className={className}>{children}</div>
    </CollapsibleContext.Provider>
  )
}

type CollapsibleTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function CollapsibleTrigger({ className, children, ...props }: CollapsibleTriggerProps) {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error('CollapsibleTrigger must be used within Collapsible.')
  }

  return (
    <button
      type="button"
      aria-expanded={context.open}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented) {
          context.toggle()
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

type CollapsibleContentProps = {
  children: React.ReactNode
  className?: string
}

export function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error('CollapsibleContent must be used within Collapsible.')
  }

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
        context.open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        className
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}
