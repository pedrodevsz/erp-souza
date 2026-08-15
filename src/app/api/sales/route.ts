import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { SalesService } from '@/server/services/sales/sales.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const sales = await SalesService.list(search)
    return successResponse(sales)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    const sale = await SalesService.create(body)
    return successResponse(sale, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
