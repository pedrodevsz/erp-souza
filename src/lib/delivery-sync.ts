import type { DeliveryItem, DeliveryStatus } from '@/types/delivery'

export function calculateDeliveryStatusFromItems(items: Array<Pick<DeliveryItem, 'delivered'>>): DeliveryStatus {
  if (items.length === 0) {
    return 'PENDING'
  }

  const deliveredCount = items.filter((item) => item.delivered).length

  if (deliveredCount === 0) {
    return 'PENDING'
  }

  if (deliveredCount === items.length) {
    return 'DELIVERED'
  }

  return 'PARTIALLY_DELIVERED'
}

export function markDeliveryItemsAsDelivered<T extends DeliveryItem>(items: T[], deliveredAt: string): T[] {
  return items.map((item) => ({
    ...item,
    delivered: true,
    deliveredAt,
  }))
}

export function markDeliveryItemsAsPending<T extends DeliveryItem>(items: T[]): T[] {
  return items.map((item) => ({
    ...item,
    delivered: false,
    deliveredAt: undefined,
  }))
}

export function completeDeliveryItems<T extends DeliveryItem>(items: T[], deliveredAt: string): T[] {
  return items.map((item) => ({
    ...item,
    delivered: true,
    deliveredAt: item.deliveredAt ?? deliveredAt,
  }))
}
