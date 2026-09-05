import { handleRouteError, successResponse } from '@/server/http/api-response'
import { DashboardService } from '@/server/services/dashboard/dashboard.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    return successResponse(await DashboardService.getSummary())
  } catch (error) {
    return handleRouteError(error)
  }
}
