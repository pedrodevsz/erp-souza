import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { DeliveryService } from '@/server/services/deliveries/deliveries.service'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    return successResponse(await DeliveryService.getById(id))
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await readJsonBody(request)
    return successResponse(await DeliveryService.update(id, body))
  } catch (error) {
    return handleRouteError(error)
  }
}

