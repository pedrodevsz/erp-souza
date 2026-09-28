import assert from 'node:assert/strict'
import test from 'node:test'
import { getEditableSaleStock } from './sale-form.types'
import type { InventoryItem } from '@/types/inventory'

const inventory = (availableStock: number): InventoryItem => ({
  id: 'inventory-1', productId: 'product-1', productName: 'Produto', brand: '', product: 'PRODUTO UN', sku: 'SKU-1', category: 'GERAL', unit: 'UN',
  costPrice: 5, profitPercentage: 50, salePrice: 10, currentStock: availableStock, minimumStock: 0, reservedStock: 0, availableStock, location: '', supplier: '', lastEntryDate: '', lastOutputDate: '', createdAt: '', updatedAt: '',
})

test('estoque editável soma a quantidade original ao estoque atual', () => {
  assert.equal(getEditableSaleStock({ productId: 'product-1', availableStock: 0 }, [inventory(0)], [{ productId: 'product-1', quantity: 10 }], true), 10)
  assert.equal(getEditableSaleStock({ productId: 'product-1', availableStock: 0 }, [inventory(3)], [{ productId: 'product-1', quantity: 10 }], true), 13)
})

test('novo item usa somente o estoque atual', () => {
  assert.equal(getEditableSaleStock({ productId: 'product-1', availableStock: 99 }, [inventory(3)], [], false), 3)
})
