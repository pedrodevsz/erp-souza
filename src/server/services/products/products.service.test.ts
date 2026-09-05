import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'

import { normalizeProductInput } from '@/lib/products'
import { ProductModel } from '@/server/models/products/products.model'
import { findOrCreateCatalogProduct } from '../purchases/purchases.service'
import { productCreateSchema } from '@/server/schemas/products/products.schema'

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

test('ProductModel valida produto sem marca e com marca vazia', () => {
  const withoutBrand = new ProductModel({
    userId: new mongoose.Types.ObjectId(),
    name: 'AREIA MÉDIA',
    unit: 'M²',
    product: 'AREIA MÉDIA M²',
    salePrice: 0,
  })

  const withEmptyBrand = new ProductModel({
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
      'user-1'
    )

    assert.equal(createdWithoutBrand.brand, '')
    assert.equal(createdWithoutBrand.product, 'AREIA MÉDIA M²')

    const existing = new ProductModel({
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
      'user-1'
    )

    assert.equal(existingProduct.brand, 'VOTORAN')
    assert.equal(existingProduct.product, 'CIMENTO SC VOTORAN')
  } finally {
    ProductModel.findOne = originalFindOne
    ProductModel.prototype.save = originalSave
  }
})
