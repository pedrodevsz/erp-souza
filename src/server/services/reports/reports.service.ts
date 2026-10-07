import type { ReportQuery } from '@/server/schemas/reports/reports.schema'

export const ReportsService = {
  async getOverview(query: ReportQuery) {
    void query
    return {
      totals: {},
      byModule: {},
    }
  },

  async getModuleReport(module: string, query: ReportQuery) {
    void query
    return {
      module,
      data: [],
    }
  },
}

export default ReportsService
