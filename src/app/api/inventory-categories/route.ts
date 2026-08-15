import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { InventoryCategoryService } from '@/server/services/inventory-categories/inventory-categories.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const categories = await InventoryCategoryService.list()
    return successResponse(categories)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    const category = await InventoryCategoryService.create(body)
    return successResponse(category, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
