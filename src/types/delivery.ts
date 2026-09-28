export type DeliveryStatus = 'PENDING' | 'IN_ROUTE' | 'PARTIALLY_DELIVERED' | 'DELIVERED' | 'CANCELLED' | 'LATE'

export interface DeliveryAddress {
  street: string
  number: string
  complement?: string
  district: string
}

export interface DeliveryItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unit: string
  delivered: boolean
  deliveredAt?: string
}

export interface Delivery {
  id: string
  saleId: string
  saleNumber: string
  customerId: string
  customerName: string
  customerPhone: string
  address: DeliveryAddress
  scheduledDate: string
  deliveredAt?: string
  status: DeliveryStatus
  driverName?: string
  notes?: string
  items: DeliveryItem[]
  createdAt: string
  updatedAt: string
}

export type UpdateDelivery = Partial<Omit<Delivery, 'id' | 'createdAt' | 'updatedAt'>>

export type DeliveryFilters = {
  dateFrom: string
  dateTo: string
}
