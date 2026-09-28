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

export function getEditableSaleStock(
  item: Pick<SaleItem, 'productId' | 'availableStock'>,
  inventoryItems: InventoryItem[],
  originalItems: Array<Pick<SaleItem, 'productId' | 'quantity'>> = [],
  isEditing = false,
) {
  const inventory = inventoryItems.find((entry) => entry.productId === item.productId || entry.id === item.productId)
  if (!inventory) return Math.max(0, item.availableStock)

  const originalQuantity = isEditing
    ? originalItems.find((entry) => entry.productId === item.productId)?.quantity ?? 0
    : 0

  return Math.max(0, inventory.availableStock + originalQuantity)
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
