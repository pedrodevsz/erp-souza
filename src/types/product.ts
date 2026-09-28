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

export type NewProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'brand'> & {
  brand?: string
}
export type UpdateProduct = Partial<NewProduct>
export type ProductInput = {
  name: string
  unit: string
  brand?: string
}
export type ProductUpdateInput = Partial<ProductInput>
