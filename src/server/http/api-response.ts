import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { AppError } from '@/server/errors/app-error'

export type SuccessResponse<T> = {
  success: true
  data: T
}

export type ErrorResponse = {
  success: false
  code?: string
  message: string
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } satisfies SuccessResponse<T>, { status })
}

export function errorResponse(message: string, status = 500, code?: string) {
  return NextResponse.json(
    {
      success: false,
      ...(code ? { code } : {}),
      message,
    } satisfies ErrorResponse,
    { status }
  )
}

function isMongoDuplicateKeyError(error: unknown) {
  if (typeof error !== 'object' || error === null) return false
  return 'code' in error && (error as { code?: number }).code === 11000
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Erro interno do servidor'
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.code)
  }

  if (error instanceof ZodError) {
    return errorResponse(error.issues[0]?.message ?? 'Dados inválidos.', 400)
  }

  if (isMongoDuplicateKeyError(error)) {
    return errorResponse('Registro já existente.', 409)
  }

  if (error instanceof Error && error.name === 'ValidationError') {
    return errorResponse(getErrorMessage(error), 400)
  }

  if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
    return errorResponse(error.message || 'Erro interno do servidor', 500)
  }

  return errorResponse('Erro interno do servidor', 500)
}
