"use client"

import React from 'react'

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={`block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ${props.className || ''}`}
        />
    )
}

export default Select
