import { NextRequest } from 'next/server'

import { handleRouteError, successResponse } from '@/server/http/api-response'
import { importPurchaseInvoice } from '@/server/services/purchases/import-invoice.service'
import { AppError } from '@/server/errors/app-error'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      throw new AppError('Arquivo não informado.', 400)
    }

    const result = await importPurchaseInvoice(file)
    return successResponse(result, 200)
  } catch (error) {
    return handleRouteError(error)
  }
}
