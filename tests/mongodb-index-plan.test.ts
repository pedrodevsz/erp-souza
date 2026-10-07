import assert from 'node:assert/strict'
import test from 'node:test'

import { MONGODB_INDEX_PLAN } from '../scripts/mongodb-index-plan'
import { CustomerModel } from '../src/server/models/customers/customers.model'
import { DeliveryModel } from '../src/server/models/deliveries/deliveries.model'
import { EmployeeModel } from '../src/server/models/employees/employees.model'
import { InventoryModel, InventoryMovementModel } from '../src/server/models/inventories/inventories.model'
import { InventoryCategoryModel } from '../src/server/models/inventory-categories/inventory-categories.model'
import { ProductReservationModel } from '../src/server/models/product-reservations/product-reservations.model'
import { ProductModel } from '../src/server/models/products/products.model'
import { PurchaseModel } from '../src/server/models/purchases/purchases.model'
import { SaleModel } from '../src/server/models/sales/sales.model'
import { SupplierModel } from '../src/server/models/suppliers/suppliers.model'
import { UserModel } from '../src/server/models/users/users.model'

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${key}:${stable(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function semanticDefinition(keys: Record<string, unknown>, options: Record<string, unknown>) {
  return stable({
    keys,
    unique: Boolean(options.unique),
    sparse: Boolean(options.sparse),
    partialFilterExpression: options.partialFilterExpression ?? null,
  })
}

test('plano de indices possui nomes deterministas e nenhuma duplicata', () => {
  const identities = MONGODB_INDEX_PLAN.map((entry) => `${entry.collection}.${entry.name}`)
  assert.equal(new Set(identities).size, identities.length)
  assert.ok(MONGODB_INDEX_PLAN.every((entry) => entry.name && Object.keys(entry.keys).length > 0))
})

test('constraints de integridade esperadas permanecem explicitas', () => {
  const unique = new Set(MONGODB_INDEX_PLAN.filter((entry) => entry.options.unique).map((entry) => `${entry.collection}.${entry.name}`))
  assert.deepEqual(unique, new Set([
    'users.username_1',
    'customers.customer_user_document_unique',
    'products.storeId_1_name_1_unit_1_brand_1',
    'inventories.storeId_1_productName_1_unit_1_brand_1',
    'inventories.storeId_1_sku_1',
    'inventories.storeId_1_productId_1',
    'inventorycategories.storeId_1_name_1',
    'suppliers.storeId_1_name_1',
    'deliveries.storeId_1_saleId_1',
  ]))
})

test('plano cobre semanticamente todos os indices declarados pelos schemas atuais', () => {
  const models = [
    UserModel, CustomerModel, EmployeeModel, ProductModel, InventoryModel, InventoryMovementModel,
    InventoryCategoryModel, SupplierModel, PurchaseModel, SaleModel, DeliveryModel, ProductReservationModel,
  ]
  const schemaDefinitions = new Set(models.flatMap((model) => (model.schema.indexes() as Array<[Record<string, unknown>, Record<string, unknown>]>).map(([keys, options]) =>
    `${model.collection.name}:${semanticDefinition(keys, options as Record<string, unknown>)}`
  )))
  const planDefinitions = new Set(MONGODB_INDEX_PLAN.map((entry) =>
    `${entry.collection}:${semanticDefinition(entry.keys, entry.options as Record<string, unknown>)}`
  ))
  assert.deepEqual([...planDefinitions].sort(), [...schemaDefinitions].sort())
})
