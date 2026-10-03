import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'

import { normalizeProductInput } from '@/lib/products'
import { SINGLE_STORE_ID, type StoreContext } from '@/server/auth/store-context'
import { calculateInventoryStatus, DEFAULT_MINIMUM_STOCK, normalizeMinimumStock } from '@/lib/inventories/inventory'
import { ProductModel } from '@/server/models/products/products.model'
import { findOrCreateCatalogProduct } from '../purchases/purchases.service'
import { productCreateSchema } from '@/server/schemas/products/products.schema'

const context: StoreContext = { storeId: SINGLE_STORE_ID, actorId: new mongoose.Types.ObjectId().toString(), role: 'USER' }

test('productCreateSchema aceita marca ausente ou vazia', () => {
  assert.equal(productCreateSchema.safeParse({ name: 'Areia média', unit: 'm²', brand: '' }).success, true)
  assert.equal(productCreateSchema.safeParse({ name: 'Areia média', unit: 'm²' }).success, true)
})

test('normalizeProductInput preserva marca informada e normaliza ausência', () => {
  assert.deepEqual(normalizeProductInput({ name: ' areia média ', unit: ' m² ' }), {
    name: 'AREIA MÉDIA',
    unit: 'M²',
    brand: '',
  })

  assert.deepEqual(normalizeProductInput({ name: ' cimento ', unit: ' sc ', brand: ' votoran ' }), {
    name: 'CIMENTO',
    unit: 'SC',
    brand: 'VOTORAN',
  })
})

test('default de estoque mínimo e fallback legacy são centralizados', () => {
  assert.equal(DEFAULT_MINIMUM_STOCK, 5)
  assert.equal(normalizeMinimumStock(undefined), 5)
  assert.equal(normalizeMinimumStock(-1), 5)
  assert.equal(normalizeMinimumStock(8), 8)
})

test('calculateInventoryStatus usa minimumStock como fonte de verdade', () => {
  assert.equal(calculateInventoryStatus({ currentStock: 21, minimumStock: 20 }), 'EM_ESTOQUE')
  assert.equal(calculateInventoryStatus({ currentStock: 20, minimumStock: 20 }), 'ESTOQUE_BAIXO')
  assert.equal(calculateInventoryStatus({ currentStock: 0, minimumStock: 20 }), 'SEM_ESTOQUE')
})

test('ProductModel valida produto sem marca e com marca vazia', () => {
  const withoutBrand = new ProductModel({
    storeId: SINGLE_STORE_ID,
    userId: new mongoose.Types.ObjectId(),
    name: 'AREIA MÉDIA',
    unit: 'M²',
    product: 'AREIA MÉDIA M²',
    salePrice: 0,
  })

  const withEmptyBrand = new ProductModel({
    storeId: SINGLE_STORE_ID,
    userId: new mongoose.Types.ObjectId(),
    name: 'AREIA MÉDIA',
    unit: 'M²',
    brand: '',
    product: 'AREIA MÉDIA M²',
    salePrice: 0,
  })

  assert.equal(withoutBrand.validateSync(), undefined)
  assert.equal(withEmptyBrand.validateSync(), undefined)
})

test('findOrCreateCatalogProduct cria produto sem marca e preserva marca existente', async () => {
  const originalFindOne = ProductModel.findOne
  const originalSave = ProductModel.prototype.save

  try {
    ProductModel.findOne = (() => ({
      session: () => Promise.resolve(null),
    })) as never

    ProductModel.prototype.save = (async function save(this: unknown) {
      return this
    }) as never

    const createdWithoutBrand = await findOrCreateCatalogProduct(
      { name: ' areia média ', unit: ' m² ' },
      context
    )

    assert.equal(createdWithoutBrand.brand, '')
    assert.equal(createdWithoutBrand.product, 'AREIA MÉDIA M²')

    const existing = new ProductModel({
      storeId: SINGLE_STORE_ID,
      userId: new mongoose.Types.ObjectId(),
      name: 'CIMENTO',
      unit: 'SC',
      brand: 'VOTORAN',
      product: 'CIMENTO SC VOTORAN',
      salePrice: 100,
    })

    ProductModel.findOne = (() => ({
      session: () => Promise.resolve(existing),
    })) as never

    const existingProduct = await findOrCreateCatalogProduct(
      { name: 'cimento', unit: 'sc', brand: 'votoran', salePrice: 100 },
      context
    )

    assert.equal(existingProduct.brand, 'VOTORAN')
    assert.equal(existingProduct.product, 'CIMENTO SC VOTORAN')
  } finally {
    ProductModel.findOne = originalFindOne
    ProductModel.prototype.save = originalSave
  }
})
