import {
  addSalePayment as apiAddSalePayment,
  cancelSale as apiCancelSale,
  createSale as apiCreateSale,
  deleteSale as apiDeleteSale,
  getSaleById as apiGetSaleById,
  getSaleHistory as apiGetSaleHistory,
  getSales as apiGetSales,
  updateSale as apiUpdateSale,
  type Sale as ApiSale,
  type SaleHistoryEntry as ApiSaleHistoryEntry,
  type SaleItemInput as ApiSaleItemInput,
} from '@/lib/sales/sales-api'
import { normalizeSaleDeliveryFlag, normalizeSaleDeliveryStatus, normalizeSalePaymentCondition } from '@/lib/sales'
import type { NewSale, Sale, SaleHistoryEntry, SaleItem, UpdateSale } from '@/types/sale'

function normalizeSale(sale: ApiSale | null | undefined): Sale {
  const legacySale = sale as { deliveryStatus?: string; status?: string } | null | undefined
  const deliveryStatus = normalizeSaleDeliveryStatus(legacySale?.deliveryStatus ?? legacySale?.status)
  const isDelivery = normalizeSaleDeliveryFlag(sale?.isDelivery, deliveryStatus)
  const paymentCondition = normalizeSalePaymentCondition(sale?.paymentCondition as never)
  const payments = (sale?.payments ?? []).map((payment, index) => ({
    id: payment.id ?? `${sale?.id ?? 'sale'}-payment-${index + 1}`,
    amount: payment.amount,
    date: payment.date,
    paymentMethod: payment.paymentMethod ?? '',
    notes: payment.notes ?? '',
  }))
  const legacyPaidAmount = (paymentCondition.installments ?? [])
    .filter((installment) => installment.status === 'PAGO')
    .reduce((sum, installment) => sum + installment.amount, 0)
  const paidAmount = sale?.paidAmount ?? (payments.length > 0 ? payments.reduce((sum, payment) => sum + payment.amount, 0) : legacyPaidAmount)
  const remainingAmount = sale?.remainingAmount ?? Number(Math.max(0, (sale?.total ?? 0) - paidAmount).toFixed(2))
  const items: SaleItem[] = (sale?.items ?? []).map((item: ApiSaleItemInput, index) => ({
    id: `${sale?.id ?? 'sale'}-item-${index + 1}`,
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    unit: item.unit,
    quantity: item.quantity,
    availableStock: item.availableStock,
    unitPrice: item.unitPrice,
    discount: item.discount ?? 0,
    subtotal: Number(((item.quantity * item.unitPrice) - (item.discount ?? 0)).toFixed(2)),
  }))

  return {
    id: sale?.id ?? '',
    customerId: sale?.customerId ?? '',
    customerName: sale?.customerName ?? '',
    sellerId: sale?.sellerId ?? '',
    sellerName: sale?.sellerName ?? '',
    saleDate: sale?.saleDate ?? '',
    isDelivery,
    deliveryStatus,
    deliveryDate: sale?.deliveryDate ?? '',
    paymentMethod: sale?.paymentMethod ?? '',
    paymentCondition,
    payments,
    paymentStatus: sale?.paymentStatus ?? (remainingAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING'),
    paidAmount,
    remainingAmount,
    initialPayment: sale?.initialPayment ?? payments[0]?.amount ?? paymentCondition.installments?.[0]?.amount ?? 0,
    notes: sale?.notes ?? '',
    subtotal: sale?.subtotal ?? 0,
    discount: sale?.discount ?? 0,
    shipping: sale?.shipping ?? 0,
    otherCosts: sale?.otherCosts ?? 0,
    total: sale?.total ?? 0,
    items,
    createdAt: sale?.createdAt ?? new Date().toISOString(),
    updatedAt: sale?.updatedAt ?? new Date().toISOString(),
  }
}

export const SalesService = {
  async getAll(search?: string): Promise<Sale[]> {
    return (await apiGetSales(search)).map((sale) => normalizeSale(sale))
  },

  async getById(id: string): Promise<Sale | null> {
    try {
      return normalizeSale(await apiGetSaleById(id))
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) return null
      throw error
    }
  },

  async create(payload: NewSale): Promise<Sale> {
    return normalizeSale(await apiCreateSale(payload))
  },

  async update(id: string, payload: UpdateSale): Promise<Sale | null> {
    try {
      return normalizeSale(await apiUpdateSale(id, payload))
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) return null
      throw error
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await apiDeleteSale(id)
      return true
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) return false
      throw error
    }
  },

  async cancel(id: string): Promise<Sale | null> {
    try {
      return normalizeSale(await apiCancelSale(id))
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) return null
      throw error
    }
  },

  async getHistory(id: string): Promise<SaleHistoryEntry[]> {
    return (await apiGetSaleHistory(id)).map((entry: ApiSaleHistoryEntry) => ({ ...entry }))
  },

  async addPayment(id: string, payload: { amount: number; date: string; paymentMethod?: string; notes?: string }): Promise<Sale | null> {
    try {
      return normalizeSale(await apiAddSalePayment(id, payload))
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) return null
      throw error
    }
  },
}
