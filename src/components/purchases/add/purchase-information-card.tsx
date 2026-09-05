import { Label, Input } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PurchaseSupplierAutocomplete } from './purchase-supplier-autocomplete'

type Props = {
  supplier: string
  supplierQuery: string
  onSupplierQueryChange: (value: string) => void
  onSupplierSelect: (value: string) => void
  onOpenNewSupplier: () => void
  purchaseDate: string
  onPurchaseDateChange: (value: string) => void
  invoiceNumber: string
  onInvoiceNumberChange: (value: string) => void
  suppliers: string[]
}

export function PurchaseInformationCard({
  supplier,
  supplierQuery,
  onSupplierQueryChange,
  onSupplierSelect,
  onOpenNewSupplier,
  purchaseDate,
  onPurchaseDateChange,
  invoiceNumber,
  onInvoiceNumberChange,
  suppliers,
}: Props) {
  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle className="text-sm font-semibold text-sky-600">Dados da Compra</CardTitle>
        <p className="text-sm text-slate-500">Selecione o fornecedor e registre a identificação básica da compra.</p>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <PurchaseSupplierAutocomplete
            suppliers={suppliers}
            supplier={supplier}
            supplierQuery={supplierQuery}
            onSupplierQueryChange={onSupplierQueryChange}
            onSupplierSelect={onSupplierSelect}
            onOpenNewSupplier={onOpenNewSupplier}
          />
        </div>

        <div>
          <Label>Data da Compra *</Label>
          <Input type="date" value={purchaseDate} onChange={(e) => onPurchaseDateChange(e.target.value)} />
        </div>

        <div className="md:col-span-3">
          <Label>Número da Nota Fiscal</Label>
          <Input value={invoiceNumber} onChange={(e) => onInvoiceNumberChange(e.target.value)} placeholder="Ex.: 12345" />
        </div>
      </CardContent>
    </Card>
  )
}
