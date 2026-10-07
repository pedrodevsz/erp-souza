import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { ProductReservationService } from '@/server/services/product-reservations/product-reservations.service'

export const runtime = 'nodejs'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return successResponse(await ProductReservationService.cancel(id))
  } catch (error) {
    return handleRouteError(error)
  }
}
