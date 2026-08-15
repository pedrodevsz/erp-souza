import type { Delivery, DeliveryItem, DeliveryStatus } from '@/types/delivery'

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: 'Pendente',
  IN_ROUTE: 'Em rota',
  PARTIALLY_DELIVERED: 'Parcialmente entregue',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelada',
  LATE: 'Atrasada',
}

export const DELIVERY_STATUS_VARIANTS: Record<DeliveryStatus, string> = {
  PENDING: 'warning',
  IN_ROUTE: 'info',
  PARTIALLY_DELIVERED: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'neutral',
  LATE: 'danger',
}

export function createDeliveryReference(id: string) {
  return id.replace(/^delivery-/i, 'ENT-').toUpperCase()
}

export function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString('pt-BR') : 'Sem data'
}

export function formatDateTime(value?: string) {
  if (!value) return 'Sem data/hora'
  return new Date(value).toLocaleString('pt-BR')
}

export function isSameDay(left: string, right: Date = new Date()) {
  const date = new Date(left)
  return (
    date.getFullYear() === right.getFullYear() &&
    date.getMonth() === right.getMonth() &&
    date.getDate() === right.getDate()
  )
}

export function isSameMonth(value: string, right: Date = new Date()) {
  const date = new Date(value)
  return date.getFullYear() === right.getFullYear() && date.getMonth() === right.getMonth()
}

export function isWithinCurrentWeek(value: string, right: Date = new Date()) {
  const date = new Date(value)
  const start = new Date(right)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())

  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return date >= start && date <= end
}

export function isOverdue(value: string, right: Date = new Date()) {
  const deadline = new Date(value)
  const today = new Date(right)
  today.setHours(0, 0, 0, 0)
  deadline.setHours(0, 0, 0, 0)
  return deadline < today
}

export function areAllItemsDelivered(items: DeliveryItem[]) {
  return items.length > 0 && items.every((item) => item.delivered)
}

export function hasDeliveredItems(items: DeliveryItem[]) {
  return items.some((item) => item.delivered)
}

export function recalculateDeliveryStatus(delivery: Delivery): DeliveryStatus {
  if (delivery.status === 'CANCELLED') return 'CANCELLED'
  if (delivery.status === 'LATE') return 'LATE'
  if (areAllItemsDelivered(delivery.items)) return 'DELIVERED'
  if (hasDeliveredItems(delivery.items)) return 'PARTIALLY_DELIVERED'
  if (delivery.status === 'IN_ROUTE') return 'IN_ROUTE'
  return 'PENDING'
}

export function canCompleteDelivery(delivery: Delivery) {
  return areAllItemsDelivered(delivery.items) && delivery.status !== 'CANCELLED'
}

export function getDeliveryStatusAfterItemToggle(delivery: Delivery): DeliveryStatus {
  if (delivery.status === 'CANCELLED') return 'CANCELLED'
  if (delivery.status === 'LATE') return 'LATE'
  if (areAllItemsDelivered(delivery.items)) return 'DELIVERED'
  if (hasDeliveredItems(delivery.items)) return 'PARTIALLY_DELIVERED'
  return delivery.status === 'IN_ROUTE' ? 'IN_ROUTE' : 'PENDING'
}

export function getDeliveryItemProgress(items: DeliveryItem[]) {
  const delivered = items.filter((item) => item.delivered).length
  return {
    delivered,
    total: items.length,
    pending: items.length - delivered,
  }
}
