import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { readJsonBody } from '@/server/http/request'
import { UserService } from '@/server/services/users/users.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return successResponse(await UserService.list())
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await UserService.create(await readJsonBody(request))
    return successResponse(user, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
