import { PurchaseApiError, createPurchase as apiCreatePurchase, deletePurchase as apiDeletePurchase, getPurchaseById as apiGetPurchaseById, getPurchases as apiGetPurchases, updatePurchase as apiUpdatePurchase } from '@/lib/purchases-api'
import { Purchase, NewPurchase, UpdatePurchase } from '@/types/purchases'
import { calculatePurchaseProfitPercentage, normalizePurchasePaymentCondition } from '@/lib/purchases'

function normalizePurchase(purchase: Purchase | null | undefined): Purchase {
    return {
        id: purchase?.id ?? '',
        supplier: purchase?.supplier ?? '',
        purchaseDate: purchase?.purchaseDate ?? new Date().toISOString(),
        expectedDelivery: purchase?.expectedDelivery ?? null,
        paymentCondition: normalizePurchasePaymentCondition(purchase?.paymentCondition),
        paymentMethod: purchase?.paymentMethod ?? null,
        invoiceNumber: purchase?.invoiceNumber ?? null,
        notes: purchase?.notes ?? '',
        items: (purchase?.items ?? []).map((item) => ({
            ...item,
            profitPercentage: item.profitPercentage ?? calculatePurchaseProfitPercentage(item.unitPrice, item.salePrice),
        })),
        subtotal: purchase?.subtotal ?? 0,
        discounts: purchase?.discounts ?? 0,
        freight: purchase?.freight ?? 0,
        otherExpenses: purchase?.otherExpenses ?? 0,
        total: purchase?.total ?? 0,
        createdAt: purchase?.createdAt ?? new Date().toISOString(),
        updatedAt: purchase?.updatedAt ?? new Date().toISOString(),
    }
}

function normalizeError(error: unknown) {
    if (error instanceof PurchaseApiError) {
        return error
    }

    if (error instanceof Error) {
        return new Error(error.message)
    }

    return new Error('Erro inesperado.')
}

export const PurchaseService = {
    async getAll(search?: string): Promise<Purchase[]> {
        const data = await apiGetPurchases(search)
        return data.map((purchase) => normalizePurchase(purchase))
    },

    async getById(id: string): Promise<Purchase | null> {
        try {
            const purchase = await apiGetPurchaseById(id)
            return normalizePurchase(purchase)
        } catch (error) {
            if (error instanceof PurchaseApiError && error.status === 404) return null
            throw normalizeError(error)
        }
    },

    async create(payload: NewPurchase): Promise<Purchase> {
        try {
            const created = await apiCreatePurchase(payload)
            return normalizePurchase(created)
        } catch (error) {
            throw normalizeError(error)
        }
    },

    async update(id: string, payload: UpdatePurchase): Promise<Purchase | null> {
        try {
            const updated = await apiUpdatePurchase(id, payload)
            return normalizePurchase(updated)
        } catch (error) {
            if (error instanceof PurchaseApiError && error.status === 404) return null
            throw normalizeError(error)
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            await apiDeletePurchase(id)
            return true
        } catch (error) {
            if (error instanceof PurchaseApiError && error.status === 404) return false
            throw normalizeError(error)
        }
    },
}
