import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { InventoryService } from '@/server/services/inventories/inventories.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit')
    const parsedLimit = limit ? Number(limit) : 5
    const movements = await InventoryService.getRecentMovements(parsedLimit)
    return successResponse(movements)
  } catch (error) {
    return handleRouteError(error)
  }
}
