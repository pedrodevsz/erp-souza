import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { ProductService } from '@/server/services/products/products.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const products = await ProductService.list(search)
    return successResponse(products)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    const product = await ProductService.create(body)
    return successResponse(product, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
