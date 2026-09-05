import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { DeliveryService } from '@/server/services/deliveries/deliveries.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const deliveries = await DeliveryService.getAll({
      search: request.nextUrl.searchParams.get('search') ?? undefined,
      status: request.nextUrl.searchParams.get('status') ?? undefined,
      dateFrom: request.nextUrl.searchParams.get('dateFrom') ?? undefined,
      dateTo: request.nextUrl.searchParams.get('dateTo') ?? undefined,
      city: request.nextUrl.searchParams.get('city') ?? undefined,
      driverName: request.nextUrl.searchParams.get('driverName') ?? undefined,
    })
    return successResponse(deliveries)
  } catch (error) {
    return handleRouteError(error)
  }
}

