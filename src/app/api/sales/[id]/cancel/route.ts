import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { SalesService } from '@/server/services/sales/sales.service'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const sale = await SalesService.cancel(id)
    return successResponse(sale)
  } catch (error) {
    return handleRouteError(error)
  }
}
