"use client"

import React, { createContext, useContext, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type TabsContextValue = {
  value: string
  setValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

type TabsProps = {
  defaultValue: string
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultValue, children, className = '' }: TabsProps) {
  const [value, setValue] = useState(defaultValue)
  const contextValue = useMemo(() => ({ value, setValue }), [value])

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>

export function TabsList({ className = '', ...props }: TabsListProps) {
  return <div className={cn('inline-flex rounded-xl bg-slate-100 p-1', className)} {...props} />
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

export function TabsTrigger({ value, className = '', onClick, ...props }: TabsTriggerProps) {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs')
  }

  const active = context.value === value

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          context.setValue(value)
        }
      }}
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        active ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900',
        className
      )}
      {...props}
    />
  )
}

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
}

export function TabsContent({ value, className = '', ...props }: TabsContentProps) {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error('TabsContent must be used within Tabs')
  }

  if (context.value !== value) return null

  return <div className={className} {...props} />
}

export default Tabs
