"use client"

import React from 'react'

export function Label({ children, className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label {...props} className={`block text-sm font-medium text-muted-foreground ${className}`}>
            {children}
        </label>
    )
}

export default Label
