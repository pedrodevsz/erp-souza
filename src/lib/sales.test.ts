import assert from 'node:assert/strict'
import test from 'node:test'
import { formatSaleHistoryDate } from './sales'

test('formatSaleHistoryDate trata data ISO válida em pt-BR', () => {
  assert.match(formatSaleHistoryDate('2026-09-23T12:00:00.000Z'), /23\/09\/2026/ )
})

test('formatSaleHistoryDate não inventa data para histórico legacy', () => {
  assert.equal(formatSaleHistoryDate(undefined), 'Data não disponível')
  assert.equal(formatSaleHistoryDate(null), 'Data não disponível')
  assert.equal(formatSaleHistoryDate('data inválida'), 'Data não disponível')
})
