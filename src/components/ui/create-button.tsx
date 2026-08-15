"use client"

import Link from 'next/link'
import React from 'react'
import { Plus } from 'lucide-react'
import { Button, type ButtonProps } from './button'

type Props = {
  name: string
  href?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}

export function CreateButton({
  name,
  href,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  variant = 'default',
  size = 'default',
}: Props) {
  const content = (
    <>
      <Plus className="mr-2 h-4 w-4" />
      {name}
    </>
  )

  if (href) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <Link href={href}>{content}</Link>
      </Button>
    )
  }

  return (
    <Button type={type} onClick={onClick} disabled={disabled} variant={variant} size={size} className={className}>
      {content}
    </Button>
  )
}

export default CreateButton
