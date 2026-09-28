import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDeliveryQuery, DeliveryService } from './deliveryService'

test('builder de query envia busca e datas, mas não filtros removidos', () => {
  const query = buildDeliveryQuery({ search: 'PEDRO', dateFrom: '2026-09-01', dateTo: '2026-09-30' })
  assert.equal(query, '?search=PEDRO&dateFrom=2026-09-01&dateTo=2026-09-30')
})

test('builder ignora parâmetros legados de status, cidade e motorista', () => {
  const query = buildDeliveryQuery({ search: 'PEDRO', status: 'PENDING', city: 'PALMAS', driverName: 'JOAO' } as never)
  assert.equal(query, '?search=PEDRO')
})

test('client não expõe mutação para marcar entrega em rota', () => {
  assert.equal('markAsInRoute' in DeliveryService, false)
})
