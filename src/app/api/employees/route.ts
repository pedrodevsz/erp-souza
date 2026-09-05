import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { EmployeeService } from '@/server/services/employees/employees.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? undefined
    const employees = await EmployeeService.list(search)
    return successResponse(employees)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request)
    const employee = await EmployeeService.create(body)
    return successResponse(employee, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
