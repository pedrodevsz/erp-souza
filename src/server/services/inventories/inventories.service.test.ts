import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'

import { buildPurchaseInventoryPayload } from './inventories.service'
import { InventoryModel } from '@/server/models/inventories/inventories.model'
import { inventoryCreateSchema } from '@/server/schemas/inventories/inventories.schema'

test('inventoryCreateSchema aceita marca ausente ou vazia', () => {
  assert.equal(
    inventoryCreateSchema.safeParse({
      productName: 'Areia média',
      brand: '',
      category: 'GERAL',
      unit: 'M²',
      costPrice: 50,
      profitPercentage: 50,
      salePrice: 75,
      currentStock: 12,
      minimumStock: 0,
      reservedStock: 0,
      supplier: 'PADEIRO',
      location: 'A definir',
    }).success,
    true
  )

  assert.equal(
    inventoryCreateSchema.safeParse({
      productName: 'Areia média',
      category: 'GERAL',
      unit: 'M²',
      costPrice: 50,
      profitPercentage: 50,
      salePrice: 75,
      currentStock: 12,
      minimumStock: 0,
      reservedStock: 0,
      supplier: 'PADEIRO',
      location: 'A definir',
    }).success,
    true
  )
})

test('buildPurchaseInventoryPayload preserva marca informada e normaliza ausência', () => {
  const withoutBrand = buildPurchaseInventoryPayload(
    {
      productId: 'prod-1',
      productName: 'AREIA MÉDIA',
      unit: 'M²',
      quantity: 12,
      unitPrice: 50,
      salePrice: 75,
      category: 'geral',
      brand: '',
    },
    'PADEIRO',
    12,
    'user-1'
  )

  assert.equal(withoutBrand.brand, '')
  assert.equal(withoutBrand.product, 'AREIA MÉDIA M²')

  const withBrand = buildPurchaseInventoryPayload(
    {
      productId: 'prod-2',
      productName: 'CIMENTO',
      unit: 'SC',
      quantity: 5,
      unitPrice: 40,
      salePrice: 60,
      category: 'geral',
      brand: 'VOTORAN',
    },
    'PADEIRO',
    5,
    'user-1'
  )

  assert.equal(withBrand.brand, 'VOTORAN')
  assert.equal(withBrand.product, 'CIMENTO SC VOTORAN')
})

test('InventoryModel valida itens sem marca sem disparar required', () => {
  const withoutBrand = new InventoryModel({
    userId: new mongoose.Types.ObjectId(),
    productId: 'prod-1',
    productName: 'AREIA MÉDIA',
    brand: '',
    product: 'AREIA MÉDIA M²',
    sku: 'EST-0001',
    category: 'geral',
    unit: 'M²',
    costPrice: 50,
    profitPercentage: 50,
    salePrice: 75,
    currentStock: 12,
    minimumStock: 0,
    reservedStock: 0,
    availableStock: 12,
    location: 'A definir',
    supplier: 'PADEIRO',
    lastEntryDate: '2026-09-04T00:00:00.000Z',
    lastOutputDate: '',
    notes: '',
  })

  const withoutBrandField = new InventoryModel({
    userId: new mongoose.Types.ObjectId(),
    productId: 'prod-2',
    productName: 'AREIA MÉDIA',
    product: 'AREIA MÉDIA M²',
    sku: 'EST-0002',
    category: 'geral',
    unit: 'M²',
    costPrice: 50,
    profitPercentage: 50,
    salePrice: 75,
    currentStock: 12,
    minimumStock: 0,
    reservedStock: 0,
    availableStock: 12,
    location: 'A definir',
    supplier: 'PADEIRO',
    lastEntryDate: '2026-09-04T00:00:00.000Z',
    lastOutputDate: '',
    notes: '',
  })

  assert.equal(withoutBrand.validateSync(), undefined)
  assert.equal(withoutBrandField.validateSync(), undefined)
})
