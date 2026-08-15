import type { InventoryItem, InventoryStatus, NewInventoryItem } from '@/types/inventory'
import type { InventoryFormValues } from '@/validations/inventory/inventory-form'
import { buildProductLabel } from '@/lib/products'
import { roundCurrency } from '@/lib/sales'
import { normalizeTextInput } from '@/lib/text'

export function calculateAvailableStock(currentStock: number, reservedStock: number) {
  return currentStock - reservedStock
}

export function calculateInventoryStatus(item: Pick<InventoryItem, 'currentStock' | 'minimumStock'>): InventoryStatus {
  if (item.currentStock === 0) return 'SEM_ESTOQUE'
  if (item.currentStock <= item.minimumStock) return 'ESTOQUE_BAIXO'
  return 'EM_ESTOQUE'
}

export function calculateItemValue(item: Pick<InventoryItem, 'currentStock' | 'costPrice'>) {
  return item.currentStock * item.costPrice
}

export function calculateInventorySalePrice(costPrice: number, profitPercentage: number) {
  if (!Number.isFinite(costPrice) || !Number.isFinite(profitPercentage)) {
    return 0
  }

  return roundCurrency(costPrice + (costPrice * profitPercentage) / 100)
}

export function calculateInventoryProfitPercentage(costPrice: number, salePrice: number) {
  if (!Number.isFinite(costPrice) || !Number.isFinite(salePrice) || costPrice <= 0) {
    return 0
  }

  return Math.max(0, roundCurrency(((salePrice - costPrice) / costPrice) * 100))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(value: string) {
  if (!value) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

export function formatDateTime(value: string) {
  if (!value) return 'Sem data/hora'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function statusLabel(status: InventoryStatus) {
  switch (status) {
    case 'EM_ESTOQUE':
      return 'Em estoque'
    case 'ESTOQUE_BAIXO':
      return 'Estoque baixo'
    case 'SEM_ESTOQUE':
      return 'Sem estoque'
  }
}

export function statusTone(status: InventoryStatus) {
  switch (status) {
    case 'EM_ESTOQUE':
      return 'success'
    case 'ESTOQUE_BAIXO':
      return 'warning'
    case 'SEM_ESTOQUE':
      return 'danger'
  }
}

export function movementTypeTone(type: string) {
  switch (type) {
    case 'Entrada':
      return 'success'
    case 'Saída':
      return 'danger'
    case 'Ajuste':
      return 'warning'
    case 'Transferência':
      return 'info'
    default:
      return 'neutral'
  }
}

export function buildInventoryFormValues(item?: Partial<InventoryFormValues> | InventoryItem | null): Partial<InventoryFormValues> {
  if (!item) {
    return {
      productName: '',
      brand: '',
      product: '',
      category: '',
      unit: '',
      costPrice: 0,
      profitPercentage: 0,
      salePrice: 0,
      currentStock: 0,
      minimumStock: 0,
      reservedStock: 0,
      supplier: '',
      location: '',
      notes: '',
    }
  }

  return {
    productName: item.productName ?? '',
    brand: item.brand ?? '',
    product: item.product ?? '',
    category: item.category ?? '',
    unit: item.unit ?? '',
    costPrice: item.costPrice ?? 0,
    profitPercentage: item.profitPercentage ?? calculateInventoryProfitPercentage(item.costPrice ?? 0, item.salePrice ?? 0),
    salePrice: item.salePrice ?? 0,
    currentStock: item.currentStock ?? 0,
    minimumStock: item.minimumStock ?? 0,
    reservedStock: item.reservedStock ?? 0,
    supplier: item.supplier ?? '',
    location: item.location ?? '',
    notes: item.notes ?? '',
  }
}

export function buildInventoryPayload(values: InventoryFormValues): NewInventoryItem {
  return {
    productName: normalizeTextInput(values.productName),
    brand: normalizeTextInput(values.brand),
    product: buildProductLabel(values.productName, values.unit, values.brand),
    category: normalizeTextInput(values.category),
    unit: normalizeTextInput(values.unit),
    costPrice: values.costPrice,
    profitPercentage: values.profitPercentage,
    salePrice: values.salePrice,
    currentStock: values.currentStock,
    minimumStock: values.minimumStock,
    reservedStock: values.reservedStock,
    location: normalizeTextInput(values.location),
    supplier: normalizeTextInput(values.supplier),
    notes: normalizeTextInput(values.notes ?? ''),
  }
}
