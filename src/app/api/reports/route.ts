import { NextRequest } from 'next/server'

import { requireStoreContext } from '@/server/auth/store-context'
import { handleRouteError, successResponse } from '@/server/http/api-response'
import { reportQuerySchema } from '@/server/schemas/reports/reports.schema'
import { ReportsService } from '@/server/services/reports/reports.service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await requireStoreContext()
    const query = reportQuerySchema.parse({
      startDate: request.nextUrl.searchParams.get('startDate') ?? undefined,
      endDate: request.nextUrl.searchParams.get('endDate') ?? undefined,
      groupBy: request.nextUrl.searchParams.get('groupBy') ?? undefined,
      compareTo: request.nextUrl.searchParams.get('compareTo') ?? undefined,
    })

    const overview = await ReportsService.getOverview(query)
    return successResponse(overview)
  } catch (error) {
    return handleRouteError(error)
  }
}
