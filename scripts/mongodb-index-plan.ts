import type { IndexDescription, IndexDirection } from 'mongodb'

export type IndexPurpose = 'INTEGRIDADE' | 'PERFORMANCE' | 'INTEGRIDADE + PERFORMANCE'

export type PlannedIndex = {
  collection: string
  name: string
  keys: Record<string, IndexDirection>
  options: Omit<IndexDescription, 'key'> & { name: string }
  purpose: IndexPurpose
  origin: string
}

function defaultName(keys: Record<string, IndexDirection>) {
  return Object.entries(keys).map(([field, direction]) => `${field}_${direction}`).join('_')
}

function planned(
  collection: string,
  keys: Record<string, IndexDirection>,
  origin: string,
  purpose: IndexPurpose = 'PERFORMANCE',
  options: Omit<IndexDescription, 'key' | 'name'> & { name?: string } = {}
): PlannedIndex {
  const name = options.name ?? defaultName(keys)
  return { collection, name, keys, options: { ...options, name }, purpose, origin }
}

function singles(collection: string, model: string, fields: string[]) {
  return fields.map((field) => planned(collection, { [field]: 1 }, `${model}.${field} index:true`))
}

export const MONGODB_INDEX_PLAN: readonly PlannedIndex[] = [
  planned('users', { username: 1 }, 'users.model.ts username unique/index', 'INTEGRIDADE + PERFORMANCE', { unique: true }),
  ...singles('users', 'users.model.ts', ['storeId', 'role', 'isActive']),

  planned('customers', { storeId: 1 }, 'customers.model.ts customerSchema.index', 'PERFORMANCE', { name: 'customer_store_lookup' }),
  planned(
    'customers',
    { storeId: 1, document: 1 },
    'customers.model.ts customerSchema.index',
    'INTEGRIDADE + PERFORMANCE',
    { unique: true, name: 'customer_user_document_unique', partialFilterExpression: { document: { $type: 'string' } } }
  ),

  ...singles('employees', 'employees.model.ts', ['storeId', 'userId', 'name', 'role', 'active']),

  ...singles('products', 'products.model.ts', ['storeId', 'userId', 'name', 'unit', 'brand', 'product']),
  planned(
    'products',
    { storeId: 1, name: 1, unit: 1, brand: 1 },
    'products.model.ts productSchema.index',
    'INTEGRIDADE + PERFORMANCE',
    { unique: true }
  ),

  ...singles('inventories', 'inventories.model.ts', [
    'storeId', 'userId', 'productName', 'brand', 'product', 'category', 'unit', 'location', 'supplier',
  ]),
  planned(
    'inventories',
    { storeId: 1, productName: 1, unit: 1, brand: 1 },
    'inventories.model.ts inventorySchema.index',
    'INTEGRIDADE + PERFORMANCE',
    { unique: true }
  ),
  planned('inventories', { storeId: 1, sku: 1 }, 'inventories.model.ts inventorySchema.index', 'INTEGRIDADE + PERFORMANCE', { unique: true }),
  planned('inventories', { storeId: 1, productId: 1 }, 'inventories.model.ts inventorySchema.index', 'INTEGRIDADE + PERFORMANCE', { unique: true }),

  ...singles('inventorymovements', 'inventories.model.ts inventoryMovementSchema', ['storeId', 'userId', 'itemId', 'type', 'date']),
  planned('inventorymovements', { itemId: 1, date: -1 }, 'inventories.model.ts inventoryMovementSchema.index'),
  planned('inventorymovements', { storeId: 1, itemId: 1, date: -1 }, 'inventories.model.ts inventoryMovementSchema.index'),

  ...singles('inventorycategories', 'inventory-categories.model.ts', ['storeId', 'userId', 'name']),
  planned(
    'inventorycategories',
    { storeId: 1, name: 1 },
    'inventory-categories.model.ts inventoryCategorySchema.index',
    'INTEGRIDADE + PERFORMANCE',
    { unique: true }
  ),

  ...singles('suppliers', 'suppliers.model.ts', ['storeId', 'userId', 'name']),
  planned('suppliers', { storeId: 1, name: 1 }, 'suppliers.model.ts supplierSchema.index', 'INTEGRIDADE + PERFORMANCE', { unique: true }),

  ...singles('purchases', 'purchases.model.ts', ['storeId', 'userId', 'supplier', 'purchaseDate', 'invoiceNumber']),

  ...singles('sales', 'sales.model.ts', [
    'storeId', 'userId', 'status', 'customerId', 'sellerId', 'saleDate', 'deliveryStatus', 'paymentMethod',
    'paymentStatus', 'customerName', 'sellerName',
  ]),

  ...singles('deliveries', 'deliveries.model.ts', [
    'storeId', 'userId', 'saleId', 'saleNumber', 'customerId', 'customerName', 'scheduledDate', 'status', 'driverName',
  ]),
  planned('deliveries', { storeId: 1, saleId: 1 }, 'deliveries.model.ts deliverySchema.index', 'INTEGRIDADE + PERFORMANCE', { unique: true }),

  ...singles('productreservations', 'product-reservations.model.ts', [
    'storeId', 'userId', 'productId', 'inventoryId', 'productName', 'product', 'sku', 'unit', 'customerId',
    'customerName', 'reservedAt',
  ]),
  planned(
    'productreservations',
    { productId: 1, customerId: 1, reservedAt: -1 },
    'product-reservations.model.ts productReservationSchema.index'
  ),
  planned(
    'productreservations',
    { storeId: 1, productId: 1, customerId: 1, reservedAt: -1 },
    'product-reservations.model.ts productReservationSchema.index'
  ),
] as const

export const INDEX_PLAN_COLLECTIONS = [...new Set(MONGODB_INDEX_PLAN.map((entry) => entry.collection))]
