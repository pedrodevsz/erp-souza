import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { SalesService } from '@/server/services/sales/sales.service'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const history = await SalesService.history(id)
    return successResponse(history)
  } catch (error) {
    return handleRouteError(error)
  }
}
