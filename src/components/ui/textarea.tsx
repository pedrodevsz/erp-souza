"use client"

import React from 'react'

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={`block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground ${props.className || ''}`}
        />
    )
}

export default Textarea
