import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { ProductReservationService } from '@/server/services/product-reservations/product-reservations.service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    const reservation = await ProductReservationService.create(body)
    return successResponse(reservation, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
