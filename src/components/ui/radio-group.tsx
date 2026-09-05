"use client"

import React, { createContext, useContext, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type RadioGroupContextValue = {
  value: string
  setValue: (value: string) => void
  name: string
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

type RadioGroupProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  className?: string
  children: React.ReactNode
}

export function RadioGroup({
  value,
  defaultValue = '',
  onValueChange,
  name = 'radio-group',
  className = '',
  children,
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value ?? internalValue

  const contextValue = useMemo(
    () => ({
      value: currentValue,
      name,
      setValue: (nextValue: string) => {
        if (value === undefined) {
          setInternalValue(nextValue)
        }
        onValueChange?.(nextValue)
      },
    }),
    [currentValue, name, onValueChange, value]
  )

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </RadioGroupContext.Provider>
  )
}

type RadioGroupItemProps = React.InputHTMLAttributes<HTMLInputElement> & {
  value: string
}

export function RadioGroupItem({ value, className = '', ...props }: RadioGroupItemProps) {
  const context = useContext(RadioGroupContext)

  if (!context) {
    throw new Error('RadioGroupItem must be used within RadioGroup')
  }

  return (
    <input
      {...props}
      type="radio"
      name={context.name}
      value={value}
      checked={context.value === value}
      onChange={() => context.setValue(value)}
      className={cn(
        'h-4 w-4 border-gray-300 text-sky-600 focus:ring-sky-500',
        className
      )}
    />
  )
}

export default RadioGroup
