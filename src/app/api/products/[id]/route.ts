import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { ProductService } from '@/server/services/products/products.service'

export const runtime = 'nodejs'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const product = await ProductService.getById(id)
    return successResponse(product)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await readJsonBody(request)
    const product = await ProductService.update(id, body)
    return successResponse(product)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const result = await ProductService.remove(id)
    return successResponse(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
