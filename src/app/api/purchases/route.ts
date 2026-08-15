import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { PurchaseService } from '@/server/services/purchases/purchases.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const purchases = await PurchaseService.list(search)
    return successResponse(purchases)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    const purchase = await PurchaseService.create(body)
    return successResponse(purchase, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
