import type { NewPurchase } from '@/types/purchases'

export type PurchaseImportMatchStatus = 'exact' | 'similar' | 'not_found' | 'multiple_matches'

export type PurchaseImportSuggestedProduct = {
  productId: string
  productName: string
  brand: string
  unit: string
  similarity: number
}

export type PurchaseImportItem = {
  supplierCode?: string | null
  barcode?: string | null
  description: string
  productName: string
  brand?: string | null
  category?: string | null
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  subtotal: number
  productId?: string | null
  product?: string | null
  salePrice?: number
  profitPercentage?: number
  matchStatus?: PurchaseImportMatchStatus
  matchConfidence?: number
  suggestedProducts?: PurchaseImportSuggestedProduct[]
}

export type PurchaseImportDraft = Omit<NewPurchase, 'items'> & {
  supplierId: string | null
  supplierDocument: string | null
  items: PurchaseImportItem[]
}

export type PurchaseImportWarning = {
  field?: string
  itemIndex?: number
  message: string
}

export type PurchaseImportSummary = {
  totalItems: number
  matchedItems: number
  reviewItems: number
  notFoundItems: number
}

export type PurchaseImportResponse = {
  status: 'ready_for_review' | 'review_required'
  purchase: PurchaseImportDraft
  warnings: PurchaseImportWarning[]
  summary: PurchaseImportSummary
}
