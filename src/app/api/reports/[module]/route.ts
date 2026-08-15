import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { reportModuleParamSchema, reportQuerySchema } from '@/server/schemas/reports/reports.schema'
import { ReportsService } from '@/server/services/reports/reports.service'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ module: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { module } = await context.params
    const parsedParams = reportModuleParamSchema.parse({ module })
    const query = reportQuerySchema.parse({
      startDate: request.nextUrl.searchParams.get('startDate') ?? undefined,
      endDate: request.nextUrl.searchParams.get('endDate') ?? undefined,
      groupBy: request.nextUrl.searchParams.get('groupBy') ?? undefined,
      compareTo: request.nextUrl.searchParams.get('compareTo') ?? undefined,
    })

    const report = await ReportsService.getModuleReport(parsedParams.module, query)
    return successResponse(report)
  } catch (error) {
    return handleRouteError(error)
  }
}
