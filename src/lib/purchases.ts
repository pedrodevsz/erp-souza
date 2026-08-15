import type { Purchase, NewPurchase, PurchasePaymentCondition } from '@/types/purchases'
import type { PurchaseImportDraft } from '@/types/purchases-import'
import { roundCurrency } from '@/lib/sales'

type PurchaseFormSource = Partial<NewPurchase> | Purchase | PurchaseImportDraft | null | undefined
type LegacyPurchasePaymentCondition = { n1?: string | null; n2?: string | null; n3?: string | null }

export const MAX_PURCHASE_PAYMENT_CONDITIONS = 15

type PurchaseCategory = 'geral' | 'hidraulico' | 'eletrico' | 'acabamento'
type PurchaseUnit = 'un' | 'm' | 'm²' | 'kg'

const PURCHASE_CATEGORY_LABELS: Record<PurchaseCategory, string> = {
    geral: 'Geral',
    hidraulico: 'Hidráulico',
    eletrico: 'Elétrico',
    acabamento: 'Acabamento',
}

const PURCHASE_CATEGORY_STYLES: Record<PurchaseCategory, { selected: string; idle: string }> = {
    geral: {
        selected: 'border-slate-400 bg-slate-100 text-slate-800 shadow-sm ring-1 ring-slate-400/20',
        idle: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800',
    },
    hidraulico: {
        selected: 'border-cyan-500 bg-cyan-50 text-cyan-800 shadow-sm ring-1 ring-cyan-500/20',
        idle: 'border-cyan-200 bg-white text-cyan-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800',
    },
    eletrico: {
        selected: 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm ring-1 ring-amber-500/20',
        idle: 'border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800',
    },
    acabamento: {
        selected: 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500/20',
        idle: 'border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800',
    },
}

const PURCHASE_UNIT_STYLES: Record<PurchaseUnit, { selected: string; idle: string }> = {
    un: {
        selected: 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-500/20',
        idle: 'border-sky-200 bg-white text-sky-700 hover:border-sky-300 hover:bg-sky-50/70 hover:text-sky-800',
    },
    m: {
        selected: 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm ring-1 ring-violet-500/20',
        idle: 'border-violet-200 bg-white text-violet-700 hover:border-violet-300 hover:bg-violet-50/70 hover:text-violet-800',
    },
    'm²': {
        selected: 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-500/20',
        idle: 'border-teal-200 bg-white text-teal-700 hover:border-teal-300 hover:bg-teal-50/70 hover:text-teal-800',
    },
    kg: {
        selected: 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-500/20',
        idle: 'border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50/70 hover:text-rose-800',
    },
}

function normalizePurchaseCategory(value: string): PurchaseCategory {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'hidraulico' || normalized === 'eletrico' || normalized === 'acabamento') return normalized
    return 'geral'
}

function normalizePurchaseUnit(value: string): PurchaseUnit {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'un' || normalized === 'm' || normalized === 'm²' || normalized === 'kg') return normalized
    return 'un'
}

export function createEmptyPurchasePaymentCondition(): PurchasePaymentCondition {
    return ['']
}

function normalizePurchasePaymentConditionValue(value: string | null | undefined) {
    return value?.trim() ?? ''
}

function normalizePurchasePaymentConditionList(values: string[]) {
    return values
        .map((value) => normalizePurchasePaymentConditionValue(value))
        .filter(Boolean)
        .slice(0, MAX_PURCHASE_PAYMENT_CONDITIONS)
}

export function normalizePurchasePaymentCondition(
    value?: PurchasePaymentCondition | LegacyPurchasePaymentCondition | string | null
): PurchasePaymentCondition {
    if (!value) {
        return []
    }

    if (typeof value === 'string') {
        return normalizePurchasePaymentConditionList(
            value
                .split(/[,\n/]+/)
                .map((part) => part.trim())
        )
    }

    if (Array.isArray(value)) {
        return normalizePurchasePaymentConditionList(value)
    }

    return normalizePurchasePaymentConditionList([value.n1, value.n2, value.n3].map((part) => part ?? ''))
}

export function getPurchasePaymentConditionValues(paymentCondition: PurchasePaymentCondition) {
    return normalizePurchasePaymentCondition(paymentCondition)
}

export function formatPurchasePaymentCondition(paymentCondition: PurchasePaymentCondition) {
    return getPurchasePaymentConditionValues(paymentCondition).join(' / ')
}

export function getPurchaseCategoryLabel(value: string) {
    return PURCHASE_CATEGORY_LABELS[normalizePurchaseCategory(value)]
}

export function getPurchaseCategoryChipClassName(value: string, selected: boolean) {
    const key = normalizePurchaseCategory(value)
    return selected ? PURCHASE_CATEGORY_STYLES[key].selected : PURCHASE_CATEGORY_STYLES[key].idle
}

export function getPurchaseUnitChipClassName(value: string, selected: boolean) {
    const key = normalizePurchaseUnit(value)
    return selected ? PURCHASE_UNIT_STYLES[key].selected : PURCHASE_UNIT_STYLES[key].idle
}

export function getPurchaseUnitLabel(value: string) {
    return normalizePurchaseUnit(value)
}

export function calculatePurchaseSalePrice(unitPrice: number, profitPercentage: number) {
    if (!Number.isFinite(unitPrice) || !Number.isFinite(profitPercentage)) {
        return 0
    }

    return roundCurrency(unitPrice + unitPrice * (profitPercentage / 100))
}

export function calculatePurchaseProfitPercentage(unitPrice: number, salePrice: number) {
    if (!Number.isFinite(unitPrice) || !Number.isFinite(salePrice) || unitPrice <= 0) return 0
    return Math.max(0, roundCurrency(((salePrice - unitPrice) / unitPrice) * 100))
}

export function buildPurchaseFormValues(purchase?: PurchaseFormSource): Partial<NewPurchase> {
    if (!purchase) {
        return {
            supplier: '',
            purchaseDate: '',
            expectedDelivery: null,
            paymentCondition: [],
            paymentMethod: null,
            invoiceNumber: null,
            notes: '',
            discounts: 0,
            freight: 0,
            otherExpenses: 0,
            items: [],
        }
    }

    return {
        supplier: purchase.supplier,
        purchaseDate: purchase.purchaseDate,
        expectedDelivery: purchase.expectedDelivery ?? null,
        paymentCondition: normalizePurchasePaymentCondition(purchase.paymentCondition),
        paymentMethod: purchase.paymentMethod ?? null,
        invoiceNumber: purchase.invoiceNumber ?? null,
        notes: purchase.notes ?? '',
        discounts: purchase.discounts ?? 0,
        freight: purchase.freight ?? 0,
        otherExpenses: purchase.otherExpenses ?? 0,
        items: (purchase.items ?? []).map((item) => {
            const salePrice = item.salePrice ?? calculatePurchaseSalePrice(item.unitPrice, item.profitPercentage ?? 0)

            return {
                productId: item.productId ?? undefined,
                productName: item.productName,
                brand: item.brand ?? '',
                product: item.product ?? '',
                category: item.category ?? 'geral',
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                profitPercentage: item.profitPercentage ?? calculatePurchaseProfitPercentage(item.unitPrice, salePrice),
                salePrice,
                discount: item.discount,
            }
        }),
    }
}
