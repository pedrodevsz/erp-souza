import type { InventoryItem } from '@/types/inventory'
import type { SaleItem, SalePaymentConditionType } from '@/types/sale'

export type SaleProductOption = Pick<
  InventoryItem,
  'id' | 'productId' | 'productName' | 'brand' | 'product' | 'sku' | 'category' | 'unit' | 'salePrice' | 'availableStock'
>

export type SaleItemDraft = SaleItem
export type SalePaymentConditionDraft = {
  type: SalePaymentConditionType | ''
  initialPayment: number
}

export function createEmptySaleItem(product?: SaleProductOption): SaleItemDraft {
  const productId = product?.productId ?? product?.id ?? ''
  const sku = product?.sku ?? productId
  const availableStock = product?.availableStock ?? 0

  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId,
    productName: product?.productName ?? '',
    brand: product?.brand ?? '',
    product: product?.product ?? '',
    sku,
    unit: product?.unit ?? 'un',
    quantity: 1,
    availableStock,
    unitPrice: product?.salePrice ?? 0,
    discount: 0,
    subtotal: product ? product.salePrice : 0,
  }
}
