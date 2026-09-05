import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { PurchaseService } from '@/server/services/purchases/purchases.service'

export const runtime = 'nodejs'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const purchase = await PurchaseService.getById(id)
    return successResponse(purchase)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await readJsonBody(request)
    const purchase = await PurchaseService.update(id, body)
    return successResponse(purchase)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const result = await PurchaseService.remove(id)
    return successResponse(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
