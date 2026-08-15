"use client"

import React from 'react'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
    props,
    ref
) {
    return (
        <input
            ref={ref}
            {...props}
            className={`block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground ${props.className || ''}`}
        />
    )
})

export default Input
