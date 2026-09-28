import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { InventoryService } from '@/server/services/inventories/inventories.service'

export const runtime = 'nodejs'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await readJsonBody(request)
    const item = await InventoryService.updateMinimumStock(id, body)
    return successResponse(item)
  } catch (error) {
    return handleRouteError(error)
  }
}
