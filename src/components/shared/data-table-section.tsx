"use client"

import React from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PageLoading } from './page-loading'

type Column = {
  header: React.ReactNode
  className?: string
}

type Props = {
  title?: React.ReactNode
  description?: React.ReactNode
  columns: Column[]
  children: React.ReactNode
  rowCount: number
  colSpan: number
  loading?: boolean
  loadingMessage?: React.ReactNode
  emptyMessage?: React.ReactNode
  emptyContent?: React.ReactNode
  toolbar?: React.ReactNode
  footer?: React.ReactNode
  dialog?: React.ReactNode
  className?: string
  tableClassName?: string
}

export function DataTableSection({
  title,
  description,
  columns,
  children,
  rowCount,
  colSpan,
  loading = false,
  loadingMessage = 'Carregando...',
  emptyMessage = 'Nenhum registro encontrado',
  emptyContent,
  toolbar,
  footer,
  dialog,
  className = '',
  tableClassName = '',
}: Props) {
  if (loading) {
    return (
      <>
        <PageLoading label={String(loadingMessage)} className="min-h-[180px]" />
        {dialog}
      </>
    )
  }

  return (
    <>
      <Card className={cn('p-3', className)}>
        {(title || description) && (
          <div className="mb-2">
            {title && <h3 className="font-semibold text-sky-600">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
        )}

        {toolbar && <div className="mb-3">{toolbar}</div>}

        <div className="overflow-auto">
          <Table className={tableClassName}>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowCount === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="py-4 text-center text-gray-500">
                    {emptyContent ?? emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                children
              )}
            </TableBody>
          </Table>
        </div>

        {footer && <div className="mt-3">{footer}</div>}
      </Card>

      {dialog}
    </>
  )
}
