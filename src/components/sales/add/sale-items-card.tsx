"use client"

import { useMemo, useState } from 'react'
import { Button, Input } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ChevronUp, Search, Trash2, MinusCircle, PlusCircle } from 'lucide-react'
import type { SaleItemDraft, SaleProductOption } from './sale-form.types'
import { formatCurrency, roundSaleQuantity, SALE_QUANTITY_STEP } from '@/lib/sales'
import { parseNumericInput } from '@/lib/number'

type Props = {
  search: string
  onSearchChange: (value: string) => void
  availableProducts: SaleProductOption[]
  items: SaleItemDraft[]
  onAddProduct: (product: SaleProductOption) => void
  onQuantityChange: (index: number, quantity: number) => void
  onDiscountChange: (index: number, discount: number) => void
  onRemoveItem: (index: number) => void
}

export function SaleItemsCard({
  search,
  onSearchChange,
  availableProducts,
  items,
  onAddProduct,
  onQuantityChange,
  onDiscountChange,
  onRemoveItem,
}: Props) {
  const [showAllProducts, setShowAllProducts] = useState(false)

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return availableProducts

    return availableProducts.filter((product) => (
      product.productName.toLowerCase().includes(q) ||
      (product.product ?? '').toLowerCase().includes(q) ||
      (product.brand ?? '').toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      product.productId.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q)
    ))
  }, [availableProducts, search])

  const visibleProducts = filteredProducts.slice(0, 5)
  const remainingProducts = filteredProducts.slice(5)
  const hasMoreProducts = filteredProducts.length > 5

  return (
    <Card>
      <CardHeader className="mb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold text-sky-600">Produtos</CardTitle>
          <p className="text-sm text-slate-500">Busque por nome, SKU ou código e adicione os itens à venda.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Pesquisar produto por nome, SKU ou código"
              className="pl-9"
            />
          </div>
          <div className="text-sm text-slate-500">
            {filteredProducts.length} produto{filteredProducts.length === 1 ? '' : 's'} {filteredProducts.length === 1 ? 'disponível' : 'disponíveis'} para venda
          </div>
        </div>

        <div className="overflow-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-slate-500">
                    Nenhum produto disponível encontrado
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {visibleProducts.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{product.productName}</div>
                        <div className="text-xs text-slate-500">{product.product ?? product.productName}</div>
                        <div className="text-xs text-slate-500">Unidade: {product.unit}</div>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <Badge variant={product.availableStock > 0 ? 'success' : 'danger'}>{product.availableStock}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(product.salePrice)}</TableCell>
                      <TableCell>
                        <Button type="button" onClick={() => onAddProduct(product)} disabled={product.availableStock <= 0}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Adicionar produto
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {showAllProducts &&
                    remainingProducts.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>
                          <div className="font-medium text-slate-900">{product.productName}</div>
                          <div className="text-xs text-slate-500">{product.product ?? product.productName}</div>
                          <div className="text-xs text-slate-500">Unidade: {product.unit}</div>
                        </TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <Badge variant={product.availableStock > 0 ? 'success' : 'danger'}>{product.availableStock}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(product.salePrice)}</TableCell>
                        <TableCell>
                          <Button type="button" onClick={() => onAddProduct(product)} disabled={product.availableStock <= 0}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar produto
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                  {hasMoreProducts && (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-4">
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowAllProducts((current) => !current)}
                            className="inline-flex items-center gap-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            {showAllProducts ? (
                              <>
                                <ChevronUp className="h-3.5 w-3.5" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                Ver mais
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="overflow-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Estoque Disponível</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Preço Unitário</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-slate-500">
                    Nenhum produto adicionado
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{item.productName}</div>
                      <div className="text-xs text-slate-500">{item.product ?? item.productName}</div>
                      <div className="text-xs text-slate-500">{item.sku}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.availableStock > 0 ? 'success' : 'danger'}>{item.availableStock}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={item.availableStock <= 0 || item.quantity <= SALE_QUANTITY_STEP}
                          onClick={() => onQuantityChange(index, Math.max(SALE_QUANTITY_STEP, roundSaleQuantity(item.quantity - SALE_QUANTITY_STEP)))}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center rounded-md border border-slate-200 bg-white px-2 py-1">
                          <Input
                            type="number"
                            min={SALE_QUANTITY_STEP}
                            max={item.availableStock}
                            step={SALE_QUANTITY_STEP}
                            inputMode="decimal"
                            value={item.quantity}
                            onChange={(e) => onQuantityChange(index, parseNumericInput(e.target.value))}
                            className="w-20 border-0 bg-transparent px-0 text-center shadow-none focus-visible:ring-0"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={item.availableStock <= 0 || item.quantity >= item.availableStock}
                          onClick={() => onQuantityChange(index, Math.min(item.availableStock, roundSaleQuantity(item.quantity + SALE_QUANTITY_STEP)))}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" className="whitespace-nowrap">
                        {item.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => onDiscountChange(index, parseNumericInput(e.target.value))}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">{formatCurrency(item.subtotal)}</TableCell>
                    <TableCell>
                      <Button type="button" variant="destructive" onClick={() => onRemoveItem(index)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
