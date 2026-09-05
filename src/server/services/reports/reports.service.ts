export const ReportsService = {
    async getOverview(_query: any) {
        return {
            totals: {},
            byModule: {},
        }
    },

    async getModuleReport(_module: string, _query: any) {
        return {
            module: _module,
            data: [],
        }
    },
}

export default ReportsService
