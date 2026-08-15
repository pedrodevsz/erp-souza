import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { InventoryService } from '@/server/services/inventories/inventories.service'

export const runtime = 'nodejs'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const item = await InventoryService.getById(id)
    return successResponse(item)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await readJsonBody(request)
    const item = await InventoryService.update(id, body)
    return successResponse(item)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await InventoryService.remove(id)
    return successResponse(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
