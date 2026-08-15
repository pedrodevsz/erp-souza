import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { SalesService } from '@/server/services/sales/sales.service'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await readJsonBody(request)
    const sale = await SalesService.addPayment(id, body)
    return successResponse(sale)
  } catch (error) {
    return handleRouteError(error)
  }
}
