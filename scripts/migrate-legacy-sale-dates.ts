import { loadEnvConfig } from '@next/env'
import mongoose from 'mongoose'

import { SaleModel } from '@/server/models/sales/sales.model'
import { auditSaleDate, type SaleDateAuditRecord } from './legacy-sale-date-rules'

loadEnvConfig(process.cwd())

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI não encontrada no ambiente.')

  const apply = process.argv.includes('--apply')
  const timeZone = process.env.SALE_DATE_TIMEZONE || 'America/Sao_Paulo'
  await mongoose.connect(uri)

  if (apply) {
    console.warn('ATENÇÃO: --apply altera documentos. Faça backup/snapshot antes de continuar.')
  } else {
    console.log('Dry-run: nenhuma escrita será executada. Use --apply somente após backup/snapshot e revisão.')
  }

  const records: SaleDateAuditRecord[] = []
  let modifiedCount = 0
  const cursor = SaleModel.find({}, { saleDate: 1, saleNumber: 1, number: 1, createdAt: 1 }).lean().cursor()
  for await (const sale of cursor) {
    const record = auditSaleDate(sale, timeZone)
    records.push(record)

    if (record.classification !== 'AUTO_CANDIDATE') continue
    console.log(JSON.stringify(record))

    if (apply && record.proposedSaleDate) {
      const result = await SaleModel.updateOne({ _id: sale._id, saleDate: record.saleDate }, { $set: { saleDate: record.proposedSaleDate } })
      modifiedCount += result.modifiedCount
    }
  }

  const autoCandidates = records.filter((record) => record.classification === 'AUTO_CANDIDATE')
  const ambiguous = records.filter((record) => record.classification === 'AMBIGUOUS')
  console.log(`Total de vendas analisadas: ${records.length}`)
  console.log(`Vendas normais: ${records.length - autoCandidates.length - ambiguous.length}`)
  console.log(`Suspeitas: ${autoCandidates.length + ambiguous.length}`)
  console.log(`Corrigíveis automaticamente: ${autoCandidates.length}`)
  console.log(`Ambíguas: ${ambiguous.length}`)
  console.log(`Documentos alterados: ${modifiedCount}`)
}

main()
  .catch((error) => {
    console.error('Falha na migração de datas de vendas:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
