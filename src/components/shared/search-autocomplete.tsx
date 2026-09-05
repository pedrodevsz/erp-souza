"use client"

import { useMemo, useState, type ReactNode } from 'react'
import { Input, Label } from '@/components/ui'

type SearchAutocompleteProps<T> = {
  label: ReactNode
  value: string
  onValueChange: (value: string) => void
  selectedKey?: string | null
  items: T[]
  getItemKey: (item: T) => string
  getItemLabel: (item: T) => string
  renderItem: (item: T, isSelected: boolean) => ReactNode
  onSelect: (item: T) => void
  filterItems: (items: T[], query: string) => T[]
  placeholder?: string
  emptyMessage?: ReactNode
  maxResults?: number
  rightAction?: ReactNode
  helperText?: ReactNode
  clearOnEmpty?: boolean
}

export function SearchAutocomplete<T>({
  label,
  value,
  onValueChange,
  selectedKey,
  items,
  getItemKey,
  getItemLabel,
  renderItem,
  onSelect,
  filterItems,
  placeholder = 'Pesquisar...',
  emptyMessage = 'Nenhum resultado encontrado',
  maxResults = 12,
  rightAction,
  helperText,
}: SearchAutocompleteProps<T>) {
  const [open, setOpen] = useState(false)

  const filteredItems = useMemo(() => {
    const query = value.trim()
    if (!query) return []
    return filterItems(items, query).slice(0, maxResults)
  }, [filterItems, items, maxResults, value])

  const showResults = open && value.trim().length > 0

  return (
    <div className="relative">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value
              onValueChange(nextValue)
              if (!nextValue.trim()) {
                return
              }
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 120)
            }}
            placeholder={placeholder}
            autoComplete="off"
          />

          {showResults && (
            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">{emptyMessage}</div>
              ) : (
                filteredItems.map((item) => {
                  const key = getItemKey(item)
                  const selected = key === selectedKey

                  return (
                    <button
                      key={key}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                      }}
                      className={`w-full border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-sky-50 last:border-b-0 ${selected ? 'bg-sky-50' : ''}`}
                      onClick={() => {
                        onValueChange(getItemLabel(item))
                        onSelect(item)
                        setOpen(false)
                      }}
                    >
                      {renderItem(item, selected)}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {rightAction}
      </div>

      {helperText && <div className="mt-2 text-xs text-sky-700">{helperText}</div>}
    </div>
  )
}
