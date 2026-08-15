export interface Product {
  id: string
  name: string
  unit: string
  brand: string
  product: string
  salePrice: number
  createdAt: string
  updatedAt: string
}

export type NewProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateProduct = Partial<NewProduct>
