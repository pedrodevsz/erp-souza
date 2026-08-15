"use client"

import React from 'react'

export const Table = ({ className = '', children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
    <table {...props} className={`w-full caption-bottom text-sm ${className}`}>
        {children}
    </table>
)

export const TableHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead {...props} className={`${className}`}>
        {children}
    </thead>
)

export const TableBody = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody {...props} className={`${className}`}>
        {children}
    </tbody>
)

export const TableRow = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr {...props} className={`border-t last:border-b ${className}`}>
        {children}
    </tr>
)

export const TableHead = ({ className = '', children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th {...props} className={`h-12 px-4 text-left align-middle text-muted-foreground ${className}`}>
        {children}
    </th>
)

export const TableCell = ({ className = '', children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td {...props} className={`p-2 align-middle ${className}`}>
        {children}
    </td>
)

export default Table
