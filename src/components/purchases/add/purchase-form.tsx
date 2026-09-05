"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { useSupplierStore } from '@/stores/useSupplierStore'
import { NewSupplierModal } from '@/components/suppliers/new-supplier-modal'
import type { NewPurchase } from '@/types/purchases'
import type { Product } from '@/types/product'
import type { Supplier } from '@/types/supplier'
import {
    createEmptyPurchaseItem,
    type PurchaseItemDraft,
    PurchaseInformationCard,
    PurchasePaymentCard,
    PurchaseSummaryCard,
    PurchaseItemsCard,
    PurchaseFormActions,
} from '@/components/purchases/add'
import { PageLoading } from '@/components/shared/page-loading'
import {
    buildPurchaseFormValues,
    calculatePurchaseProfitPercentage,
    calculatePurchaseSalePrice,
    createEmptyPurchasePaymentCondition,
    MAX_PURCHASE_PAYMENT_CONDITIONS,
    normalizePurchasePaymentCondition,
} from '@/lib/purchases'
import { purchaseMessages } from '@/lib/messages/feedback'
import type { Purchase } from '@/types/purchases'
import { buildProductLabel } from '@/lib/products'
import { ProductService } from '@/services/products/productService'
import { normalizeFiniteNumber } from '@/lib/number'
import { normalizeExtractedText, summarizePurchaseImportPayload } from '@/lib/purchase-import-extraction'
import { normalizeTextInput } from '@/lib/text'
import type { PurchaseImportDraft } from '@/types/purchases-import'

type Props = {
    initialValues?: Partial<NewPurchase> | Purchase | PurchaseImportDraft | null
    onSubmit?: (data: NewPurchase) => Promise<void> | void
    onCancel?: () => void
    submitLabel?: string
}

function buildInitialItems(initialValues?: Partial<NewPurchase> | Purchase | PurchaseImportDraft | null): PurchaseItemDraft[] {
    if (!initialValues?.items?.length) return [createEmptyPurchaseItem()]

    return initialValues.items.map((item) => ({
        productId: item.productId ?? undefined,
        productSearch:
            normalizeExtractedText((item as { description?: string | null }).description) ??
            normalizeExtractedText(item.product) ??
            normalizeExtractedText(item.productName) ??
            '',
        productName: normalizeExtractedText(item.productName) ?? normalizeExtractedText((item as { description?: string | null }).description) ?? '',
        brand: normalizeExtractedText(item.brand) ?? '',
        sourceDescription: normalizeExtractedText((item as { description?: string | null }).description) ?? undefined,
        category: normalizeExtractedText(item.category) ?? 'geral',
        quantity: Math.max(1, Math.trunc(item.quantity || 0)),
        unit: normalizeExtractedText(item.unit) ?? 'un',
        unitPrice: item.unitPrice,
        profitPercentage: item.profitPercentage ?? calculatePurchaseProfitPercentage(item.unitPrice, item.salePrice ?? 0),
        salePrice: item.salePrice ?? 0,
        discount: item.discount ?? 0,
        subtotal: Math.max(1, Math.trunc(item.quantity || 0)) * item.unitPrice - (item.discount ?? 0),
        salePriceManualOverride: false,
        matchStatus: (item as { matchStatus?: PurchaseItemDraft['matchStatus'] }).matchStatus,
        matchConfidence: (item as { matchConfidence?: number }).matchConfidence,
        suggestedProducts: (item as { suggestedProducts?: PurchaseItemDraft['suggestedProducts'] }).suggestedProducts,
    }))
}

function calculateTotals(items: PurchaseItemDraft[]) {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const discounts = items.reduce((sum, item) => sum + (item.discount || 0), 0)
    const total = subtotal - discounts

    return { subtotal, discounts, total }
}

export function PurchaseForm({ initialValues, onSubmit, onCancel, submitLabel }: Props) {
    const router = useRouter()
    const toast = useToast()
    const suppliers = useSupplierStore((s) => s.suppliers)
    const loadSuppliers = useSupplierStore((s) => s.loadSuppliers)
    const createSupplier = useSupplierStore((s) => s.createSupplier)
    const [products, setProducts] = useState<Product[]>([])
    const normalized = buildPurchaseFormValues(initialValues ?? null)
    const initialItems = buildInitialItems(initialValues ?? null)
    const [items, setItems] = useState<PurchaseItemDraft[]>(() => initialItems)
    const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(() => {
        const reviewIndex = initialItems.findIndex((item) => item.matchStatus && item.matchStatus !== 'exact')
        return reviewIndex >= 0 ? reviewIndex : Math.max(0, initialItems.length - 1)
    })
    const [loadingOptions, setLoadingOptions] = useState(true)
    const [newSupplierOpen, setNewSupplierOpen] = useState(false)

    const [supplier, setSupplier] = useState(normalized.supplier ?? '')
    const [supplierQuery, setSupplierQuery] = useState(normalized.supplier ?? '')
    const [purchaseDate, setPurchaseDate] = useState(normalized.purchaseDate ? normalized.purchaseDate.slice(0, 10) : '')
    const [paymentCondition, setPaymentCondition] = useState(() => {
        const initial = normalizePurchasePaymentCondition(normalized.paymentCondition)
        return initial.length > 0 ? initial : createEmptyPurchasePaymentCondition()
    })
    const [paymentMethod, setPaymentMethod] = useState(normalized.paymentMethod ?? '')
    const [invoiceNumber, setInvoiceNumber] = useState(normalized.invoiceNumber ?? '')
    const [notes, setNotes] = useState(normalized.notes ?? '')
    const [discounts, setDiscounts] = useState<number>(normalized.discounts ?? 0)
    const [freight, setFreight] = useState<number>(normalized.freight ?? 0)
    const [otherExpenses, setOtherExpenses] = useState<number>(normalized.otherExpenses ?? 0)
    const reviewSummary = useMemo(
        () =>
            items.reduce(
                (summary, item) => {
                    if (item.matchStatus === 'exact') summary.exact += 1
                    if (item.matchStatus === 'similar') summary.similar += 1
                    if (item.matchStatus === 'multiple_matches') summary.multiple += 1
                    if (item.matchStatus === 'not_found') summary.notFound += 1
                    return summary
                },
                { exact: 0, similar: 0, multiple: 0, notFound: 0 }
            ),
        [items]
    )

    useEffect(() => {
        let active = true

        async function loadOptions() {
            setLoadingOptions(true)

            try {
                const [supplierResult, productResult] = await Promise.allSettled([
                    loadSuppliers(),
                    ProductService.getAll(),
                ])

                if (!active) return

                if (productResult.status === 'fulfilled') {
                    setProducts(productResult.value)
                } else {
                    setProducts([])
                    toast.push({ title: 'Erro', description: 'Não foi possível carregar os produtos.', type: 'error' })
                }

                if (supplierResult.status === 'rejected') {
                    toast.push({ title: 'Erro', description: 'Não foi possível carregar os fornecedores.', type: 'error' })
                }
            } finally {
                if (active) setLoadingOptions(false)
            }
        }

        loadOptions()

        return () => {
            active = false
        }
    }, [loadSuppliers, toast])

    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' && initialValues) {
            console.info('[import-invoice] form-reset-values', summarizePurchaseImportPayload(initialValues))
        }
    }, [initialValues])

    const itemTotals = calculateTotals(items)
    const total = itemTotals.subtotal - discounts + freight + otherExpenses

    if (loadingOptions) {
        return <PageLoading />
    }

    const updatePaymentCondition = (index: number, value: string) => {
        setPaymentCondition((current) => current.map((currentValue, currentIndex) => (currentIndex === index ? value : currentValue)))
    }

    const addPaymentCondition = () => {
        setPaymentCondition((current) => (current.length >= MAX_PURCHASE_PAYMENT_CONDITIONS ? current : [...current, '']))
    }

    const removePaymentCondition = (index: number) => {
        setPaymentCondition((current) => (current.length <= 1 ? current : current.filter((_, currentIndex) => currentIndex !== index)))
    }

    const handleAddItem = () => {
        setItems((current) => {
            const nextIndex = current.length
            setExpandedItemIndex(nextIndex)
            return [...current, createEmptyPurchaseItem()]
        })
    }

    const handleRemoveItem = () => {
        setItems((current) => {
            if (current.length <= 1) return current

            const nextLength = current.length - 1
            setExpandedItemIndex((currentExpanded) => {
                if (currentExpanded === null) return null
                return Math.max(0, Math.min(currentExpanded, nextLength - 1))
            })
            return current.slice(0, -1)
        })
    }

    const updateRow = (index: number, updater: (row: PurchaseItemDraft) => PurchaseItemDraft) => {
        setItems((current) => current.map((row, rowIndex) => (rowIndex === index ? updater(row) : row)))
    }

    const handleProductQueryChange = (index: number, value: string) => {
        updateRow(index, (row) => ({
            ...row,
            productSearch: value,
            productId: value.trim() ? row.productId : undefined,
        }))
    }

    const handleProductSelect = (index: number, product: Product) => {
        updateRow(index, (row) => ({
            ...row,
            productId: product.id,
            productSearch: product.product,
            productName: product.name,
            unit: product.unit,
            brand: product.brand,
        }))
    }

    const handleProductNameChange = (index: number, value: string) => {
        updateRow(index, (row) => ({
            ...row,
            productId: undefined,
            productSearch: value,
            productName: value,
            subtotal: row.quantity * row.unitPrice - (row.discount || 0),
        }))
    }

    const handleBrandChange = (index: number, value: string) => {
        updateRow(index, (row) => ({
            ...row,
            productId: undefined,
            brand: value,
            subtotal: row.quantity * row.unitPrice - (row.discount || 0),
        }))
    }

    const handleCategoryChange = (index: number, value: string) => {
        updateRow(index, (row) => ({
            ...row,
            category: value,
        }))
    }

    const handleQuantityChange = (index: number, quantity: number) => {
        const normalizedQuantity = Math.max(1, Math.trunc(quantity || 0))
        updateRow(index, (row) => ({
            ...row,
            quantity: normalizedQuantity,
            subtotal: normalizedQuantity * row.unitPrice - (row.discount || 0),
        }))
    }

    const handleUnitChange = (index: number, unit: string) => {
        updateRow(index, (row) => ({
            ...row,
            productId: undefined,
            unit,
            subtotal: row.quantity * row.unitPrice - (row.discount || 0),
        }))
    }

    const handleUnitPriceChange = (index: number, unitPrice: number) => {
        updateRow(index, (row) => ({
            ...row,
            unitPrice,
            salePrice: row.salePriceManualOverride ? row.salePrice : calculatePurchaseSalePrice(unitPrice, row.profitPercentage),
            subtotal: row.quantity * unitPrice - (row.discount || 0),
        }))
    }

    const handleProfitPercentageChange = (index: number, profitPercentage: number) => {
        updateRow(index, (row) => ({
            ...row,
            profitPercentage,
            salePrice: row.salePriceManualOverride ? row.salePrice : calculatePurchaseSalePrice(row.unitPrice, profitPercentage),
            subtotal: row.quantity * row.unitPrice - (row.discount || 0),
        }))
    }

    const handleSalePriceChange = (index: number, salePrice: number) => {
        updateRow(index, (row) => ({
            ...row,
            salePrice,
            profitPercentage: calculatePurchaseProfitPercentage(row.unitPrice, salePrice),
            salePriceManualOverride: true,
        }))
    }

    const handleSupplierQueryChange = (value: string) => {
        setSupplierQuery(value)

        if (!value.trim()) {
            setSupplier('')
            return
        }

        if (supplier && supplier !== value) {
            setSupplier('')
        }
    }

    const handleSupplierSelect = (value: string) => {
        setSupplier(value)
        setSupplierQuery(value)
    }

    const handleSupplierCreated = (createdSupplier: Supplier) => {
        setSupplier(createdSupplier.name)
        setSupplierQuery(createdSupplier.name)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (items.some((item) => !item.productName?.trim() || !item.unit.trim())) {
            toast.push({ title: 'Erro', description: 'Preencha nome e unidade em todos os produtos.', type: 'error' })
            return
        }

        if (!supplier.trim()) {
            toast.push({ title: 'Fornecedor obrigatório', description: 'Selecione um fornecedor válido.', type: 'error' })
            return
        }

        const payload: NewPurchase = {
            supplier: normalizeTextInput(supplier),
            purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
            expectedDelivery: null,
            paymentCondition: normalizePurchasePaymentCondition(paymentCondition),
            paymentMethod: normalizeTextInput(paymentMethod) || null,
            invoiceNumber: normalizeTextInput(invoiceNumber) || null,
            notes: normalizeTextInput(notes),
            discounts: normalizeFiniteNumber(discounts),
            freight: normalizeFiniteNumber(freight),
            otherExpenses: normalizeFiniteNumber(otherExpenses),
            items: items.map((item) => ({
        productId: item.productId ?? undefined,
                productName: normalizeTextInput(item.productName ?? ''),
                brand: normalizeTextInput(item.brand ?? ''),
                product: buildProductLabel(item.productName ?? '', item.unit, item.brand ?? ''),
                category: normalizeTextInput(item.category),
                quantity: normalizeFiniteNumber(item.quantity),
                unit: normalizeTextInput(item.unit),
                unitPrice: normalizeFiniteNumber(item.unitPrice),
                profitPercentage: normalizeFiniteNumber(item.profitPercentage),
                salePrice: normalizeFiniteNumber(item.salePrice),
                discount: normalizeFiniteNumber(item.discount ?? 0),
            })),
        }

        if (onSubmit) {
            await onSubmit(payload)
            return
        }

        console.log(payload)
        toast.push({ title: 'Sucesso', description: purchaseMessages.created, type: 'success' })
    }

    const handleCancel = () => {
        if (onCancel) {
            onCancel()
            return
        }

        router.back()
    }

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                    {initialValues?.items?.length ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            Importação carregada: {reviewSummary.exact} itens identificados, {reviewSummary.similar} semelhantes, {reviewSummary.multiple} com múltiplas opções e {reviewSummary.notFound} não encontrados.
                        </div>
                    ) : null}

                    <PurchaseInformationCard
                        supplier={supplier}
                        supplierQuery={supplierQuery}
                        onSupplierQueryChange={handleSupplierQueryChange}
                        onSupplierSelect={handleSupplierSelect}
                        onOpenNewSupplier={() => setNewSupplierOpen(true)}
                        purchaseDate={purchaseDate}
                        onPurchaseDateChange={setPurchaseDate}
                        invoiceNumber={invoiceNumber}
                        onInvoiceNumberChange={setInvoiceNumber}
                        suppliers={suppliers}
                    />

                    <PurchasePaymentCard
                        paymentCondition={paymentCondition}
                        onPaymentConditionChange={updatePaymentCondition}
                        onAddPaymentCondition={addPaymentCondition}
                        onRemovePaymentCondition={removePaymentCondition}
                        paymentMethod={paymentMethod}
                        onPaymentMethodChange={setPaymentMethod}
                        notes={notes}
                        onNotesChange={setNotes}
                    />

                    <PurchaseItemsCard
                        items={items}
                        products={products}
                        onAddItem={handleAddItem}
                        onRemoveItem={handleRemoveItem}
                        expandedItemIndex={expandedItemIndex}
                        onExpandedItemChange={(index) => setExpandedItemIndex(index)}
                        onProductQueryChange={handleProductQueryChange}
                        onProductSelect={handleProductSelect}
                        onProductNameChange={handleProductNameChange}
                        onBrandChange={handleBrandChange}
                        onCategoryChange={handleCategoryChange}
                        onQuantityChange={handleQuantityChange}
                        onUnitChange={handleUnitChange}
                        onUnitPriceChange={handleUnitPriceChange}
                        onProfitPercentageChange={handleProfitPercentageChange}
                        onSalePriceChange={handleSalePriceChange}
                        loading={loadingOptions}
                    />
                </div>

                <aside className="space-y-4">
                    <PurchaseSummaryCard
                        subtotal={itemTotals.subtotal}
                        discounts={discounts}
                        freight={freight}
                        otherExpenses={otherExpenses}
                        total={total}
                        onDiscountsChange={setDiscounts}
                        onFreightChange={setFreight}
                        onOtherExpensesChange={setOtherExpenses}
                    />
                    <div className="p-4 border rounded">
                        <div className="text-sm text-gray-600">Itens da Compra</div>
                        <div className="mt-2">
                            {items.length} {items.length === 1 ? 'item' : 'itens'}
                        </div>
                    </div>
                    <div className="p-4 border rounded">
                        <PurchaseFormActions disabled={false} onCancel={handleCancel} submitLabel={submitLabel} />
                    </div>
                </aside>
            </div>

        </form>

        <NewSupplierModal
            open={newSupplierOpen}
            onOpenChange={setNewSupplierOpen}
            onCreate={createSupplier}
            onCreated={handleSupplierCreated}
        />
        </>
    )
}
