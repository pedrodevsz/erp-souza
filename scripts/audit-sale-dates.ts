import { loadEnvConfig } from '@next/env'
import mongoose from 'mongoose'

import { SaleModel } from '@/server/models/sales/sales.model'
import { auditSaleDate, type SaleDateAuditRecord } from './legacy-sale-date-rules'

loadEnvConfig(process.cwd())

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI não encontrada no ambiente.')

  const timeZone = process.env.SALE_DATE_TIMEZONE || 'America/Sao_Paulo'
  await mongoose.connect(uri)

  const records: SaleDateAuditRecord[] = []
  const cursor = SaleModel.find({}, { saleDate: 1, saleNumber: 1, number: 1, createdAt: 1 }).lean().cursor()
  for await (const sale of cursor) {
    records.push(auditSaleDate(sale, timeZone))
  }

  const autoCandidates = records.filter((record) => record.classification === 'AUTO_CANDIDATE')
  const ambiguous = records.filter((record) => record.classification === 'AMBIGUOUS')
  console.log(`Timezone da auditoria: ${timeZone}`)
  console.log(`Total de vendas analisadas: ${records.length}`)
  console.log(`Vendas normais: ${records.length - autoCandidates.length - ambiguous.length}`)
  console.log(`Suspeitas: ${autoCandidates.length + ambiguous.length}`)
  console.log(`Corrigíveis automaticamente: ${autoCandidates.length}`)
  console.log(`Ambíguas: ${ambiguous.length}`)
  console.log('\nCandidatos determinísticos:')
  console.log(JSON.stringify(autoCandidates, null, 2))
  console.log('\nRegistros ambíguos:')
  console.log(JSON.stringify(ambiguous, null, 2))
}

main()
  .catch((error) => {
    console.error('Falha na auditoria de datas de vendas:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
