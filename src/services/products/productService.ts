import {
  createProduct as apiCreateProduct,
  deleteProduct as apiDeleteProduct,
  getProducts as apiGetProducts,
  updateProduct as apiUpdateProduct,
  ProductApiError,
} from '@/lib/products-api'
import type { Product } from '@/types/product'
import type { ProductInput } from '@/lib/products'

export { ProductApiError }

export const ProductService = {
  async getAll(search?: string): Promise<Product[]> {
    return apiGetProducts(search)
  },

  async create(data: ProductInput): Promise<Product> {
    return apiCreateProduct(data)
  },

  async update(id: string, data: Partial<ProductInput>): Promise<Product> {
    return apiUpdateProduct(id, data)
  },

  async delete(id: string): Promise<boolean> {
    await apiDeleteProduct(id)
    return true
  },
}
