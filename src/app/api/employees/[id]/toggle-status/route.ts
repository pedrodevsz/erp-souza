import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { EmployeeService } from '@/server/services/employees/employees.service'

export const runtime = 'nodejs'

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const employee = await EmployeeService.toggleStatus(id)
    return successResponse(employee)
  } catch (error) {
    return handleRouteError(error)
  }
}
