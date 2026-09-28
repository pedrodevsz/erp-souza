import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { toPublicUser } from './user-public'

test('toPublicUser tolera timestamps legados ausentes ou inválidos', () => {
  const result = toPublicUser({ _id: new mongoose.Types.ObjectId(), username: 'SALETE', role: 'USER', isActive: true, createdAt: undefined, updatedAt: 'data inválida' })
  assert.equal(result.createdAt, null)
  assert.equal(result.updatedAt, null)
  assert.equal('passwordHash' in result, false)
})

test('toPublicUser serializa timestamps válidos', () => {
  const result = toPublicUser({ _id: new mongoose.Types.ObjectId(), username: 'SALETE', role: 'USER', isActive: true, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-02T00:00:00.000Z') })
  assert.equal(result.createdAt, '2026-01-01T00:00:00.000Z')
  assert.equal(result.updatedAt, '2026-01-02T00:00:00.000Z')
})
