export function normalizeExtractedText(value: unknown): string | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') {
        const v = value.trim()
        return v.length > 0 ? v : null
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return null
}

export function summarizePurchaseImportPayload(payload: unknown) {
    if (!payload || typeof payload !== 'object') return null

    const value = payload as Record<string, unknown>

    const items = Array.isArray(value.items) ? value.items : []

    return {
        supplier: value.supplier ?? value.supplierId ?? null,
        invoiceNumber: value.invoiceNumber ?? value.invoice ?? null,
        total: value.total ?? value.subtotal ?? null,
        totalItems: items.length,
    }
}

const purchaseImportExtraction = { normalizeExtractedText, summarizePurchaseImportPayload }

export default purchaseImportExtraction
