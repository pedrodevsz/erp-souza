export type InventoryStatus = 'EM_ESTOQUE' | 'ESTOQUE_BAIXO' | 'SEM_ESTOQUE'

export type InventoryMovementType = 'Entrada' | 'Saída' | 'Ajuste' | 'Transferência'

export interface InventoryMovement {
  id: string
  itemId: string
  type: InventoryMovementType
  quantity: number
  date: string
  description: string
  user: string
}

export interface InventoryItem {
  id: string
  productId: string
  productName: string
  brand: string
  product: string
  sku: string
  category: string
  unit: string
  costPrice: number
  profitPercentage: number
  salePrice: number
  currentStock: number
  minimumStock: number
  reservedStock: number
  availableStock: number
  location: string
  supplier: string
  lastEntryDate: string
  lastOutputDate: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type InventoryFilters = {
  category: string
  supplier: string
  status: 'all' | InventoryStatus
}

export type NewInventoryItem = Omit<
  InventoryItem,
  'id' | 'productId' | 'sku' | 'availableStock' | 'createdAt' | 'updatedAt' | 'lastEntryDate' | 'lastOutputDate'
> & {
  productId?: string
  sku?: string
  lastEntryDate?: string
  lastOutputDate?: string
}

export type UpdateInventoryItem = Partial<NewInventoryItem>
