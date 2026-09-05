export type PurchaseItemDraft = {
  productId?: string
  productSearch?: string
  productName?: string
  brand?: string
  sourceDescription?: string
  category: string
  quantity: number
  unit: string
  unitPrice: number
  profitPercentage: number
  salePrice: number
  discount: number
  subtotal: number
  salePriceManualOverride: boolean
  matchStatus?: 'exact' | 'similar' | 'not_found' | 'multiple_matches'
  matchConfidence?: number
  suggestedProducts?: Array<{
    productId: string
    productName: string
    brand: string
    unit: string
    similarity: number
  }>
}

export const PURCHASE_UNITS = ['un', 'm', 'm²', 'kg'] as const
export const PURCHASE_CATEGORIES = ['geral', 'hidraulico', 'eletrico', 'acabamento'] as const

export function createEmptyPurchaseItem(): PurchaseItemDraft {
  return {
    productId: undefined,
    productSearch: '',
    productName: undefined,
    brand: undefined,
    sourceDescription: undefined,
    category: 'geral',
    quantity: 1,
    unit: 'un',
    unitPrice: 0,
    profitPercentage: 0,
    salePrice: 0,
    discount: 0,
    subtotal: 0,
    salePriceManualOverride: false,
  }
}
