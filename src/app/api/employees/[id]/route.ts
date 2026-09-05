import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { EmployeeService } from '@/server/services/employees/employees.service'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const employee = await EmployeeService.getById(id)
    return successResponse(employee)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await readJsonBody(request)
    const employee = await EmployeeService.update(id, body)
    return successResponse(employee)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await EmployeeService.remove(id)
    return successResponse(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
