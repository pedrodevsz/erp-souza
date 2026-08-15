export type SaleDeliveryStatus = 'PENDING' | 'DELIVERED'
export type SaleStatus = SaleDeliveryStatus
export type SalePaymentConditionType = 'A_VISTA' | 'PARCELADO' | 'FIADO' | 'PRAZO'
export type SaleInstallmentStatus = 'PENDENTE' | 'PAGO'
export type SalePaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID'

export interface SaleInstallment {
  id: string
  number: number
  amount: number
  paymentMethod: string
  dueDate?: string
  status: SaleInstallmentStatus
}

export interface SalePayment {
  id: string
  amount: number
  date: string
  paymentMethod: string
  notes?: string
}

export interface SalePaymentCondition {
  type: SalePaymentConditionType
  installments?: SaleInstallment[]
}

export interface SaleItem {
  id: string
  productId: string
  productName: string
  brand?: string
  product?: string
  sku: string
  unit: string
  quantity: number
  availableStock: number
  unitPrice: number
  discount: number
  subtotal: number
}

export interface Sale {
  id: string
  customerId: string
  customerName: string
  sellerId: string
  sellerName: string
  saleDate: string
  isDelivery: boolean
  deliveryStatus: SaleDeliveryStatus
  deliveryDate?: string
  paymentMethod: string
  paymentCondition: SalePaymentCondition
  payments: SalePayment[]
  paymentStatus: SalePaymentStatus
  paidAmount: number
  remainingAmount: number
  initialPayment?: number
  notes?: string
  subtotal: number
  discount: number
  shipping: number
  otherCosts: number
  total: number
  items: SaleItem[]
  createdAt: string
  updatedAt: string
}

export type NewSale = Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'total' | 'items' | 'deliveryStatus' | 'paymentCondition' | 'payments' | 'paymentStatus' | 'paidAmount' | 'remainingAmount'> & {
  paymentCondition: Omit<SalePaymentCondition, 'installments'>
  payments?: Array<Omit<SalePayment, 'id'>>
  initialPayment?: number
  items: Array<Omit<SaleItem, 'id' | 'subtotal'>>
}

export type UpdateSale = Partial<NewSale>

export type SaleFilters = {
  deliveryStatus: 'all' | SaleDeliveryStatus
  paymentMethod: 'all' | string
}

export type SaleHistoryAction = 'created' | 'updated' | 'delivered' | 'cancelled' | 'payment_added'

export interface SaleHistoryEntry {
  id: string
  saleId: string
  action: SaleHistoryAction
  description: string
  user: string
  date: string
}
