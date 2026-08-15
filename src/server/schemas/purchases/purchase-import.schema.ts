import { z } from 'zod'

const purchaseInvoiceItemSchema = z.object({
  supplierCode: z.string().trim().nullable().optional(),
  barcode: z.string().trim().nullable().optional(),
  description: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  brand: z.string().trim().nullable().optional(),
  category: z.string().trim().nullable().optional(),
  quantity: z.number().finite().nonnegative(),
  unit: z.string().trim().min(1),
  unitPrice: z.number().finite().nonnegative(),
  discount: z.number().finite().nonnegative(),
  subtotal: z.number().finite().nonnegative(),
})

export const invoiceExtractionSchema = z.object({
  supplier: z.object({
    name: z.string().trim().min(1),
    document: z.string().trim().nullable().optional(),
  }),
  invoiceNumber: z.string().trim().nullable().optional(),
  invoiceAccessKey: z.string().trim().nullable().optional(),
  purchaseDate: z.string().trim().nullable().optional(),
  expectedDelivery: z.string().trim().nullable().optional(),
  paymentMethod: z.string().trim().nullable().optional(),
  paymentCondition: z.array(z.string().trim()).default([]),
  subtotal: z.number().finite().nonnegative(),
  discounts: z.number().finite().nonnegative(),
  freight: z.number().finite().nonnegative(),
  otherExpenses: z.number().finite().nonnegative(),
  total: z.number().finite().nonnegative(),
  items: z.array(purchaseInvoiceItemSchema).min(1),
})

export const purchaseImportSuggestionSchema = z.object({
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  similarity: z.number().finite().min(0).max(1),
})

export const purchaseImportItemSchema = purchaseInvoiceItemSchema.extend({
  productId: z.string().trim().nullable().optional(),
  product: z.string().trim().nullable().optional(),
  salePrice: z.number().finite().nonnegative().optional(),
  profitPercentage: z.number().finite().nonnegative().optional(),
  matchStatus: z.enum(['exact', 'similar', 'not_found', 'multiple_matches']).optional(),
  matchConfidence: z.number().finite().min(0).max(1).optional(),
  suggestedProducts: z.array(purchaseImportSuggestionSchema).optional(),
})

export const purchaseImportDraftSchema = z.object({
  supplierId: z.string().trim().nullable(),
  supplier: z.string().trim(),
  supplierDocument: z.string().trim().nullable(),
  invoiceNumber: z.string().trim(),
  invoiceAccessKey: z.string().trim(),
  purchaseDate: z.string().trim(),
  expectedDelivery: z.string().trim(),
  paymentCondition: z.array(z.string().trim()),
  paymentMethod: z.string().trim(),
  subtotal: z.number().finite().nonnegative(),
  discounts: z.number().finite().nonnegative(),
  freight: z.number().finite().nonnegative(),
  otherExpenses: z.number().finite().nonnegative(),
  total: z.number().finite().nonnegative(),
  items: z.array(purchaseImportItemSchema).min(1),
})

export const purchaseImportWarningSchema = z.object({
  field: z.string().trim().optional(),
  itemIndex: z.number().int().nonnegative().optional(),
  message: z.string().trim().min(1),
})

export const purchaseImportSummarySchema = z.object({
  totalItems: z.number().int().nonnegative(),
  matchedItems: z.number().int().nonnegative(),
  reviewItems: z.number().int().nonnegative(),
  notFoundItems: z.number().int().nonnegative(),
})

export const purchaseImportResponseSchema = z.object({
  status: z.enum(['ready_for_review', 'review_required']),
  purchase: purchaseImportDraftSchema,
  warnings: z.array(purchaseImportWarningSchema),
  summary: purchaseImportSummarySchema,
})

export type InvoiceExtraction = z.infer<typeof invoiceExtractionSchema>
export type PurchaseImportDraft = z.infer<typeof purchaseImportDraftSchema>
export type PurchaseImportResponse = z.infer<typeof purchaseImportResponseSchema>
export type PurchaseImportItem = z.infer<typeof purchaseImportItemSchema>
export type PurchaseImportWarning = z.infer<typeof purchaseImportWarningSchema>
export type PurchaseImportSummary = z.infer<typeof purchaseImportSummarySchema>
