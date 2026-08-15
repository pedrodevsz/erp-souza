import { z } from 'zod'

export const reportModuleParamSchema = z.object({ module: z.string().trim().min(1) })

export const reportQuerySchema = z
    .object({
        startDate: z.string().trim().nullable().optional(),
        endDate: z.string().trim().nullable().optional(),
        groupBy: z.string().trim().nullable().optional(),
        compareTo: z.string().trim().nullable().optional(),
    })
    .partial()

export type ReportQuery = z.infer<typeof reportQuerySchema>

export type ReportModuleParam = z.infer<typeof reportModuleParamSchema>

export default { reportModuleParamSchema, reportQuerySchema }
