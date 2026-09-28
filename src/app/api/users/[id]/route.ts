import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { UserService } from '@/server/services/users/users.service'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    return successResponse(await UserService.update(id, await readJsonBody(request)))
  } catch (error) {
    return handleRouteError(error)
  }
}
