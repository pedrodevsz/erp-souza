import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { InventoryService } from '@/server/services/inventories/inventories.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const items = await InventoryService.list(search)
    return successResponse(items)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    const item = await InventoryService.create(body)
    return successResponse(item, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
