"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { SaleInformationCard } from './sale-information-card'
import { SaleItemsCard } from './sale-items-card'
import { SaleNotesCard } from './sale-notes-card'
import { SaleFormActions } from './sale-form-actions'
import { SaleCustomerDialog } from './sale-customer-dialog'
import { SaleSideSheets } from './sale-side-sheets'
import { createEmptySaleItem, type SaleItemDraft, type SaleProductOption } from './sale-form.types'
import { useSellerEmployees } from '@/hooks/employees/useSellerEmployees'
import type { Customer } from '@/types/customer'
import type { NewSale, Sale } from '@/types/sale'
import { CustomerService } from '@/services/customerService'
import {
  isImmediateSalePaymentCondition,
  calculateChange,
  calculateSaleItemSubtotal,
  calculateSaleTotal,
  calculateSaleSubtotal,
  roundSaleQuantity,
  SALE_QUANTITY_STEP,
  normalizeSalePaymentConditionType,
  roundCurrency,
} from '@/lib/sales'
import { useCustomerStore } from '@/stores/customers/useCustomerStore'
import { useInventoryStore } from '@/stores/inventories/useInventoryStore'
import { normalizeTextInput } from '@/lib/text'

type Props = {
  initialValues?: Partial<Sale>
  submitLabel?: string
  onSubmit?: (data: NewSale) => Promise<unknown> | unknown
  onCancel?: () => void
}

function buildItems(initialValues?: Partial<Sale>): SaleItemDraft[] {
  return initialValues?.items?.length
    ? initialValues.items.map((item) => ({
        ...item,
        productId: item.productId?.trim() || item.id || '',
        sku: item.sku?.trim() || item.productId?.trim() || item.id || '',
        availableStock: Number.isFinite(item.availableStock) ? item.availableStock : 0,
        brand: item.brand ?? '',
        product: item.product ?? '',
      }))
    : []
}

function toISODate(value: string) {
  if (!value) return new Date().toISOString()
  return new Date(`${value}T12:00:00`).toISOString()
}

export function SaleForm({ initialValues, submitLabel = 'Salvar Venda', onSubmit, onCancel }: Props) {
  const router = useRouter()
  const toast = useToast()
  const isEditing = Boolean(initialValues?.id)
  const customers = useCustomerStore((state) => state.customers)
  const loadCustomers = useCustomerStore((state) => state.loadCustomers)
  const inventoryItems = useInventoryStore((state) => state.items)
  const loadInventory = useInventoryStore((state) => state.loadInventory)
  const { sellerEmployees, loading: sellerLoading, error: sellerError } = useSellerEmployees()
  const sortedCustomers = useMemo(
    () =>
      [...customers].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', {
          sensitivity: 'base',
        })
      ),
    [customers]
  )
  const [customerId, setCustomerId] = useState(initialValues?.customerId ?? '')
  const [customerQuery, setCustomerQuery] = useState(initialValues?.customerName ?? '')
  const [saleDate, setSaleDate] = useState(initialValues?.saleDate ? initialValues.saleDate.slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [sellerId, setSellerId] = useState(initialValues?.sellerId ?? '')
  const [paymentConditionType, setPaymentConditionType] = useState(initialValues?.paymentCondition?.type ?? '')
  const [paymentMethod, setPaymentMethod] = useState(initialValues?.paymentMethod ?? '')
  const [initialPayment, setInitialPayment] = useState(initialValues?.initialPayment ?? initialValues?.paidAmount ?? 0)
  const [isDelivery, setIsDelivery] = useState(initialValues?.isDelivery ?? false)
  const [deliveryDate, setDeliveryDate] = useState(initialValues?.deliveryDate ? initialValues.deliveryDate.slice(0, 10) : '')
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const [discount, setDiscount] = useState(initialValues?.discount ?? 0)
  const [shipping, setShipping] = useState(initialValues?.shipping ?? 0)
  const [otherCosts, setOtherCosts] = useState(initialValues?.otherCosts ?? 0)
  const [items, setItems] = useState<SaleItemDraft[]>(() => buildItems(initialValues))
  const [search, setSearch] = useState('')
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [openPanel, setOpenPanel] = useState<'summary' | 'payment' | 'quick' | null>(null)

  useEffect(() => {
    loadCustomers()
    loadInventory()
  }, [loadCustomers, loadInventory])

  const availableProducts = useMemo<SaleProductOption[]>(() => {
    const selectedProductIds = new Set(items.map((item) => item.productId))
    return inventoryItems
      .filter((item) => item.availableStock > 0 || selectedProductIds.has(item.productId))
      .map((item) => ({
        id: item.id,
        productId: item.productId?.trim() || item.id,
        productName: item.productName,
        brand: item.brand,
        product: item.product,
        sku: item.sku?.trim() || item.productId?.trim() || item.id,
        category: item.category,
        unit: item.unit,
        salePrice: item.salePrice,
        availableStock: Number.isFinite(item.availableStock) ? item.availableStock : Math.max(0, item.currentStock - item.reservedStock),
      }))
  }, [inventoryItems, items])

  const subtotal = useMemo(() => calculateSaleSubtotal(items), [items])
  const total = useMemo(() => calculateSaleTotal(subtotal, discount, shipping, otherCosts), [discount, otherCosts, shipping, subtotal])
  const effectiveInitialPayment = isImmediateSalePaymentCondition(paymentConditionType) ? total : initialPayment
  const change = useMemo(() => calculateChange(effectiveInitialPayment, total), [effectiveInitialPayment, total])
  const remainingAfterInitial = useMemo(() => Math.max(0, total - effectiveInitialPayment), [effectiveInitialPayment, total])
  const effectiveSellerId = sellerId || sellerEmployees[0]?.id || ''
  const selectedSeller = useMemo(
    () => sellerEmployees.find((entry) => entry.id === effectiveSellerId) ?? null,
    [sellerEmployees, effectiveSellerId]
  )
  const itemsQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  const updateItem = (index: number, updater: (item: SaleItemDraft) => SaleItemDraft) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? updater(item) : item)))
  }

  const handleAddProduct = (product: SaleProductOption) => {
    const normalizedProduct: SaleProductOption = {
      ...product,
      productId: product.productId?.trim() || product.id,
      sku: product.sku?.trim() || product.productId?.trim() || product.id,
      availableStock: Number.isFinite(product.availableStock) ? product.availableStock : 0,
    }

    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.productId === normalizedProduct.productId)

      if (existingIndex >= 0) {
        const existing = current[existingIndex]
        if (existing.quantity >= normalizedProduct.availableStock) {
          toast.push({
            title: 'Estoque insuficiente',
            description: `Não há estoque suficiente de ${normalizedProduct.productName}.`,
            type: 'error',
          })
          return current
        }

        return current.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                productId: normalizedProduct.productId,
                sku: normalizedProduct.sku,
                availableStock: normalizedProduct.availableStock,
                quantity: roundSaleQuantity(item.quantity + SALE_QUANTITY_STEP),
                subtotal: calculateSaleItemSubtotal(roundSaleQuantity(item.quantity + SALE_QUANTITY_STEP), item.unitPrice, item.discount),
              }
            : item
        )
      }

      return [...current, createEmptySaleItem(normalizedProduct)]
    })
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    const current = items[index]
    if (!current) return

    if (quantity <= 0) {
      toast.push({ title: 'Quantidade inválida', description: 'A quantidade deve ser maior que zero.', type: 'error' })
      return
    }

    const normalizedQuantity = roundSaleQuantity(quantity)

    if (normalizedQuantity > current.availableStock) {
      toast.push({
        title: 'Estoque insuficiente',
        description: `Quantidade acima do estoque disponível para ${current.productName}.`,
        type: 'error',
      })
      return
    }

    updateItem(index, (item) => ({
      ...item,
      quantity: normalizedQuantity,
      subtotal: calculateSaleItemSubtotal(normalizedQuantity, item.unitPrice, item.discount),
    }))
  }

  const handleDiscountChange = (index: number, value: number) => {
    if (value < 0) {
      toast.push({ title: 'Desconto inválido', description: 'O desconto não pode ser negativo.', type: 'error' })
      return
    }

    updateItem(index, (item) => ({
      ...item,
      discount: value,
      subtotal: calculateSaleItemSubtotal(item.quantity, item.unitPrice, value),
    }))
  }

  const handleRemoveItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleCustomerCreated = (customer: Customer) => {
    setCustomerId(customer.id)
    setCustomerQuery(customer.name)
  }

  const handleCustomerQueryChange = (value: string) => {
    setCustomerQuery(value)

    if (!value.trim()) {
      setCustomerId('')
      return
    }

    const currentCustomer = customers.find((entry) => entry.id === customerId) ?? null
    if (currentCustomer && currentCustomer.name !== value) {
      setCustomerId('')
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setCustomerId(customer.id)
    setCustomerQuery(customer.name)
  }

  const handlePaymentConditionChange = (value: string) => {
    const nextType = normalizeSalePaymentConditionType(value)
    setPaymentConditionType(nextType)

    if (isImmediateSalePaymentCondition(nextType)) {
      setInitialPayment(total)
    } else if (initialPayment > total) {
      setInitialPayment(0)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!customerId.trim()) {
      toast.push({ title: 'Cliente obrigatório', description: 'Selecione um cliente para continuar.', type: 'error' })
      return
    }

    if (items.length === 0) {
      toast.push({ title: 'Produtos obrigatórios', description: 'Adicione pelo menos um produto à venda.', type: 'error' })
      return
    }

    if (items.some((item) => item.quantity <= 0)) {
      toast.push({ title: 'Quantidade inválida', description: 'Todos os itens precisam ter quantidade maior que zero.', type: 'error' })
      return
    }

    if (items.some((item) => item.quantity > item.availableStock)) {
      toast.push({ title: 'Estoque insuficiente', description: 'Revise a quantidade dos itens selecionados.', type: 'error' })
      return
    }

    if (items.some((item) => item.unitPrice < 0 || item.discount < 0)) {
      toast.push({ title: 'Valores inválidos', description: 'Preço e desconto não podem ser negativos.', type: 'error' })
      return
    }

    if (!paymentConditionType) {
      toast.push({ title: 'Condição obrigatória', description: 'Selecione a condição de pagamento.', type: 'error' })
      return
    }

    const paymentCondition: NewSale['paymentCondition'] = {
      type: normalizeSalePaymentConditionType(paymentConditionType || 'A_VISTA'),
    }

    const total = calculateSaleTotal(subtotal, discount, shipping, otherCosts)

    if (isImmediateSalePaymentCondition(paymentCondition.type)) {
      if (!paymentMethod.trim()) {
        toast.push({ title: 'Forma de pagamento obrigatória', description: 'Selecione a forma de pagamento.', type: 'error' })
        return
      }
      setInitialPayment(total)
    } else if (!Number.isFinite(initialPayment) || initialPayment < 0) {
      toast.push({ title: 'Valor inválido', description: 'Informe um valor maior ou igual a zero para a primeira parcela.', type: 'error' })
      return
    } else if (initialPayment > total) {
      toast.push({ title: 'Valor inválido', description: 'A primeira parcela não pode ser maior que o total da venda.', type: 'error' })
      return
    }

    let customer = customers.find((entry) => entry.id === customerId) ?? null
    if (!customer) {
      customer = await CustomerService.getById(customerId)
    }
    const seller = sellerEmployees.find((entry) => entry.id === effectiveSellerId)

    if (!customer) {
      toast.push({ title: 'Cliente inválido', description: 'O cliente selecionado não foi encontrado.', type: 'error' })
      return
    }

    if (!seller) {
      toast.push({ title: 'Vendedor inválido', description: 'Selecione um vendedor válido.', type: 'error' })
      return
    }

    const payload: NewSale = {
      customerId: customer.id,
      customerName: normalizeTextInput(customer.name),
      sellerId: seller.id,
      sellerName: normalizeTextInput(seller.name),
      saleDate: toISODate(saleDate),
      isDelivery,
      deliveryDate: isDelivery && deliveryDate ? toISODate(deliveryDate) : undefined,
      paymentMethod: isImmediateSalePaymentCondition(paymentCondition.type) ? normalizeTextInput(paymentMethod) : '',
      paymentCondition,
      initialPayment: isEditing ? undefined : isImmediateSalePaymentCondition(paymentCondition.type) ? total : roundCurrency(initialPayment),
      notes: normalizeTextInput(notes),
      discount: roundCurrency(discount),
      shipping: roundCurrency(shipping),
      otherCosts: roundCurrency(otherCosts),
      items: items.map((item) => ({
        productId: item.productId?.trim() || '',
        productName: normalizeTextInput(item.productName),
        brand: normalizeTextInput(item.brand),
        product: normalizeTextInput(item.product),
        sku: normalizeTextInput(item.sku?.trim() || item.productId?.trim() || ''),
        unit: normalizeTextInput(item.unit),
        quantity: item.quantity,
        availableStock: Number.isFinite(item.availableStock) ? item.availableStock : 0,
        unitPrice: item.unitPrice,
        discount: roundCurrency(item.discount),
      })),
    }

    if (onSubmit) {
      await onSubmit(payload)
      return
    }

    console.log(payload)
    toast.push({ title: 'Sucesso', description: 'Venda preparada com sucesso.', type: 'success' })
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
      return
    }

    router.back()
  }

  const productSearch = search.trim().toLowerCase()
  const filteredProducts = availableProducts.filter((product) => {
    if (!productSearch) return true
    return (
      product.productName.toLowerCase().includes(productSearch) ||
      (product.product ?? '').toLowerCase().includes(productSearch) ||
      (product.brand ?? '').toLowerCase().includes(productSearch) ||
      product.sku.toLowerCase().includes(productSearch) ||
      product.productId.toLowerCase().includes(productSearch)
    )
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SaleFormActions submitLabel={submitLabel} onCancel={handleCancel} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <SaleInformationCard
            customerId={customerId}
            customerQuery={customerQuery}
            onCustomerQueryChange={handleCustomerQueryChange}
        onCustomerSelect={handleCustomerSelect}
            customers={sortedCustomers}
            onOpenNewCustomer={() => setNewCustomerOpen(true)}
            isDelivery={isDelivery}
            onIsDeliveryChange={(next) => {
              setIsDelivery(next)
              if (!next) setDeliveryDate('')
            }}
            saleDate={saleDate}
            onSaleDateChange={setSaleDate}
            sellerId={effectiveSellerId}
            onSellerChange={setSellerId}
            sellerEmployees={sellerEmployees}
            sellerLoading={sellerLoading}
            sellerError={sellerError}
            paymentConditionType={paymentConditionType}
            onPaymentConditionChange={handlePaymentConditionChange}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            deliveryDate={deliveryDate}
            onDeliveryDateChange={setDeliveryDate}
            initialPayment={effectiveInitialPayment}
            onInitialPaymentChange={setInitialPayment}
            remainingAfterInitial={remainingAfterInitial}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <SaleSideSheets
            openPanel={openPanel}
            onOpenPanel={setOpenPanel}
            subtotal={subtotal}
            discount={discount}
            shipping={shipping}
            otherCosts={otherCosts}
            total={total}
            onDiscountChange={setDiscount}
            onShippingChange={setShipping}
            onOtherCostsChange={setOtherCosts}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            paymentConditionType={paymentConditionType}
            initialPayment={effectiveInitialPayment}
            onInitialPaymentChange={setInitialPayment}
            change={change}
            remainingAfterInitial={remainingAfterInitial}
            customerName={customerQuery || 'Nenhum cliente selecionado'}
            sellerName={selectedSeller?.name ?? 'Nenhum vendedor selecionado'}
            itemsCount={items.length}
            itemsQuantity={itemsQuantity}
            productsCount={availableProducts.length}
          />
        </aside>

        <div className="lg:col-span-2">
          <SaleItemsCard
            search={search}
            onSearchChange={setSearch}
            availableProducts={filteredProducts}
            items={items}
            onAddProduct={handleAddProduct}
            onQuantityChange={handleQuantityChange}
            onDiscountChange={handleDiscountChange}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        <div className="lg:col-span-2">
          <SaleNotesCard notes={notes} onNotesChange={setNotes} />
        </div>
      </div>

      <SaleCustomerDialog
        open={newCustomerOpen}
        onOpenChange={setNewCustomerOpen}
        onCustomerCreated={handleCustomerCreated}
      />
    </form>
  )
}
