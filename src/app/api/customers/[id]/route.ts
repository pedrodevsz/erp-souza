import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { CustomerService } from '@/server/services/customer.service'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const customer = await CustomerService.getById(id)
    return successResponse(customer)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await readJsonBody(request)
    const customer = await CustomerService.update(id, body)
    return successResponse(customer)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const result = await CustomerService.remove(id)
    return successResponse(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
