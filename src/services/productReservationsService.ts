import { createProductReservation as apiCreateProductReservation, ProductReservationApiError } from '@/lib/product-reservations-api'
import type { NewProductReservation, ProductReservation } from '@/types/product-reservation'

export { ProductReservationApiError }

export const ProductReservationService = {
  async create(data: NewProductReservation): Promise<ProductReservation> {
    return apiCreateProductReservation(data)
  },
}
