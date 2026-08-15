import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { DeliveryService } from '@/server/services/deliveries/deliveries.service'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>
}

export async function PATCH(_request: NextRequest, context: RouteContext) {
  try {
    const { id, itemId } = await context.params
    return successResponse(await DeliveryService.markItemAsDelivered(id, itemId))
  } catch (error) {
    return handleRouteError(error)
  }
}

