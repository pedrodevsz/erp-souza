"use client"

import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, Input, Label, Select } from '@/components/ui'
import { NewSupplierModal } from '@/components/suppliers/new-supplier-modal'
import { InventoryCategoryModal } from './inventory-category-modal'
import { useInventoryCategoryStore } from '@/stores/inventories/useInventoryCategoryStore'
import { useSupplierStore } from '@/stores/useSupplierStore'
import type { InventoryFormValues } from '@/validations/inventory/inventory-form'
import { SearchAutocomplete } from '@/components/shared'
import { ProductService } from '@/services/products/productService'
import type { Product } from '@/types/product'
import { buildProductLabel } from '@/lib/products'

export function InventoryProductCard() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<InventoryFormValues>()
  const categories = useInventoryCategoryStore((state) => state.categories)
  const loadCategories = useInventoryCategoryStore((state) => state.loadCategories)
  const createCategory = useInventoryCategoryStore((state) => state.createCategory)
  const suppliers = useSupplierStore((state) => state.suppliers)
  const loadSuppliers = useSupplierStore((state) => state.loadSuppliers)
  const createSupplier = useSupplierStore((state) => state.createSupplier)
  const [products, setProducts] = useState<Product[]>([])
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)

  const categoryValue = watch('category')
  const supplierValue = watch('supplier')
  const productNameValue = watch('productName')

  useEffect(() => {
    loadCategories()
    loadSuppliers()
    ProductService.getAll().then(setProducts).catch(() => setProducts([]))
  }, [loadCategories, loadSuppliers])

  return (
    <Card>
      <CardHeader className="mb-2">
        <CardTitle className="text-sm font-semibold text-sky-600">Dados do Produto</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <SearchAutocomplete
            label="Produto"
            value={productNameValue ?? ''}
            onValueChange={(value) => {
              const next = value.trim()
              setValue('productName', next, { shouldValidate: true })
            }}
            selectedKey={null}
            items={products}
            getItemKey={(item) => item.id}
            getItemLabel={(item) => item.product}
            filterItems={(list, query) =>
              list.filter((product) =>
                [product.product, product.name, product.unit, product.brand].some((field) =>
                  field.toLowerCase().includes(query.trim().toLowerCase())
                )
              )
            }
            placeholder="Busque um produto"
            emptyMessage="Nenhum produto encontrado"
            onSelect={(product) => {
              setValue('productName', product.name, { shouldValidate: true })
              setValue('unit', product.unit, { shouldValidate: true })
              setValue('brand', product.brand, { shouldValidate: true })
            }}
            renderItem={(product) => (
              <div>
                <div className="font-medium text-slate-900">{product.product}</div>
                <div className="text-xs text-slate-500">{buildProductLabel(product.name, product.unit, product.brand)}</div>
              </div>
            )}
          />
          {errors.productName && <p className="mt-1 text-sm text-red-600">{errors.productName.message}</p>}
        </div>

        <div className="md:col-span-1">
          <Label>Categoria *</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={categoryValue ?? ''}
              onChange={(event) => setValue('category', event.target.value, { shouldValidate: true })}
              className="min-w-0 flex-1"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </Select>
            <Button type="button" variant="outline" className="w-full whitespace-nowrap sm:w-auto" onClick={() => setCategoryModalOpen(true)}>
              Nova
            </Button>
          </div>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
        </div>

        <div>
          <Label>Unidade *</Label>
          <Input {...register('unit')} placeholder="Ex.: un, kg, m, m²" />
          {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
        </div>

        <div>
          <Label>Marca *</Label>
          <Input {...register('brand')} placeholder="Ex.: Votoran" />
          {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand.message}</p>}
        </div>

        <div className="md:col-span-1">
          <Label>Fornecedor *</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={supplierValue ?? ''}
              onChange={(event) => setValue('supplier', event.target.value, { shouldValidate: true })}
              className="min-w-0 flex-1"
            >
              <option value="">Selecione um fornecedor</option>
              {suppliers.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </Select>
            <Button type="button" variant="outline" className="w-full whitespace-nowrap sm:w-auto" onClick={() => setSupplierModalOpen(true)}>
              Novo
            </Button>
          </div>
          {errors.supplier && <p className="mt-1 text-sm text-red-600">{errors.supplier.message}</p>}
        </div>

        <div>
          <Label>Localização *</Label>
          <Input {...register('location')} placeholder="Ex.: A1 - Prateleira 01" />
          {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
        </div>
      </CardContent>

      <InventoryCategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCreate={async (name) => {
          await createCategory(name)
          setValue('category', name, { shouldValidate: true })
        }}
      />

      <NewSupplierModal
        open={supplierModalOpen}
        onOpenChange={setSupplierModalOpen}
        onCreate={async (name) => {
          return createSupplier(name)
        }}
        onCreated={(supplier) => {
          setValue('supplier', supplier.name, { shouldValidate: true })
        }}
      />
    </Card>
  )
}
