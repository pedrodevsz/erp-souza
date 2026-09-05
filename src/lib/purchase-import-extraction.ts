export function normalizeExtractedText(value: unknown): string | null {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') {
        const v = value.trim()
        return v.length > 0 ? v : null
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return null
}

export function summarizePurchaseImportPayload(payload: any) {
    if (!payload) return null

    const items = Array.isArray(payload.items) ? payload.items : []

    return {
        supplier: payload.supplier ?? payload.supplierId ?? null,
        invoiceNumber: payload.invoiceNumber ?? payload.invoice ?? null,
        total: payload.total ?? payload.subtotal ?? null,
        totalItems: items.length,
    }
}

export default { normalizeExtractedText, summarizePurchaseImportPayload }
