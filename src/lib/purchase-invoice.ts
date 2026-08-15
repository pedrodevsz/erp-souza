export const MAX_PURCHASE_INVOICE_UPLOAD_BYTES = 10 * 1024 * 1024

export const PURCHASE_INVOICE_ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'] as const

export const PURCHASE_INVOICE_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const

export type PurchaseInvoiceFileExtension = (typeof PURCHASE_INVOICE_ALLOWED_EXTENSIONS)[number]
export type PurchaseInvoiceMimeType = (typeof PURCHASE_INVOICE_ALLOWED_MIME_TYPES)[number]

export function getPurchaseInvoiceFileExtension(fileName: string) {
  const parts = fileName.trim().toLowerCase().split('.')
  if (parts.length < 2) return ''
  return parts.at(-1) ?? ''
}

export function formatPurchaseInvoiceFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isAllowedPurchaseInvoiceExtension(value: string): value is PurchaseInvoiceFileExtension {
  return (PURCHASE_INVOICE_ALLOWED_EXTENSIONS as readonly string[]).includes(value.toLowerCase())
}

export function isAllowedPurchaseInvoiceMimeType(value: string): value is PurchaseInvoiceMimeType {
  return (PURCHASE_INVOICE_ALLOWED_MIME_TYPES as readonly string[]).includes(value.toLowerCase())
}
