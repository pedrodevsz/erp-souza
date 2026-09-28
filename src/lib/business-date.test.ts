import assert from 'node:assert/strict'
import test from 'node:test'

import { formatBusinessDate, getTodayBusinessDate, normalizeBusinessDate } from './business-date'

test('formata datas civis sem aplicar timezone', () => {
  for (const [input, expected] of [
    ['2026-01-01', '01/01/2026'],
    ['2026-02-28', '28/02/2026'],
    ['2026-12-31', '31/12/2026'],
    ['2028-02-29', '29/02/2028'],
    ['2026-09-23T15:00:00.000Z', '23/09/2026'],
  ]) {
    assert.equal(formatBusinessDate(input), expected)
  }
})

test('normaliza registros legados para a parte civil sem converter o dia', () => {
  assert.equal(normalizeBusinessDate('2026-09-23'), '2026-09-23')
  assert.equal(normalizeBusinessDate('2026-09-23T15:00:00.000Z'), '2026-09-23')
})

test('data civil atual usa o calendario local, não UTC', () => {
  assert.equal(getTodayBusinessDate(new Date(2026, 8, 23, 21, 4)), '2026-09-23')
  assert.equal(getTodayBusinessDate(new Date('2026-09-26T00:08:39.000Z'), 'America/Sao_Paulo'), '2026-09-25')
  assert.equal(getTodayBusinessDate(new Date('2026-09-26T00:08:39.000Z'), 'UTC'), '2026-09-26')
})
