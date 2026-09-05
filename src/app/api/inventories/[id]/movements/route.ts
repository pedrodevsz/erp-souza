import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { InventoryService } from '@/server/services/inventories/inventories.service'

export const runtime = 'nodejs'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const limit = request.nextUrl.searchParams.get('limit')
    const movements = await InventoryService.getMovements(id)
    return successResponse(typeof limit === 'string' && limit ? movements.slice(0, Number(limit)) : movements)
  } catch (error) {
    return handleRouteError(error)
  }
}
