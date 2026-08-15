import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { SupplierService } from '@/server/services/suppliers/suppliers.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const suppliers = await SupplierService.list(search)
    return successResponse(suppliers)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    const supplier = await SupplierService.create(body)
    return successResponse(supplier, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
