export type PurchasePaymentCondition = string[]

export interface PurchaseItem {
    id: string
    productId: string
    productName: string
    brand?: string
    product?: string
    category: string
    quantity: number
    unit: string
    unitPrice: number
    profitPercentage: number
    salePrice: number
    discount: number
    subtotal: number
}

export interface Purchase {
    id: string
    supplier: string
    purchaseDate: string
    expectedDelivery?: string | null
    paymentCondition: PurchasePaymentCondition
    paymentMethod?: string | null
    invoiceNumber?: string | null
    notes?: string
    items: PurchaseItem[]
    subtotal: number
    discounts: number
    freight: number
    otherExpenses: number
    total: number
    createdAt: string
    updatedAt: string
}

export type PurchaseItemInput = Omit<PurchaseItem, 'id' | 'subtotal' | 'productId'> & {
    productId?: string
}

export type NewPurchase = Omit<Purchase, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'total' | 'items'> & {
    items: PurchaseItemInput[]
}

export type UpdatePurchase = Partial<NewPurchase>
