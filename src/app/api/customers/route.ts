import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { CustomerService } from '@/server/services/customer.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const customers = await CustomerService.list(search)
    return successResponse(customers)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    const customer = await CustomerService.create(body)
    return successResponse(customer, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
