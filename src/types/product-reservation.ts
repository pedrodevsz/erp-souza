export type ProductReservation = {
  id: string
  productId: string
  inventoryId: string
  productName: string
  product: string
  sku: string
  unit: string
  customerId: string
  customerName: string
  quantity: number
  reservedAt: string
  createdAt: string
  updatedAt: string
}

export type NewProductReservation = {
  productId: string
  customerId: string
  quantity: number
}
