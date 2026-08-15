import OpenAI, { APIConnectionError, APIConnectionTimeoutError, APIError, AuthenticationError, BadRequestError, InternalServerError, PermissionDeniedError, RateLimitError, UnprocessableEntityError } from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'

import { AppError } from '@/server/errors/app-error'
import { ProductModel, type ProductDocumentShape } from '@/server/models/products/products.model'
import { PurchaseModel } from '@/server/models/purchases/purchases.model'
import { SupplierModel, type SupplierDocumentShape } from '@/server/models/suppliers/suppliers.model'
import { InventoryModel, type InventoryDocumentShape } from '@/server/models/inventories/inventories.model'
import { connectToDatabase } from '@/server/db/mongodb'
import { requireCurrentUser } from '@/server/auth/current-user'
import { buildProductLabel } from '@/lib/products'
import { calculatePurchaseSalePrice } from '@/lib/purchases'
import { roundCurrency } from '@/lib/sales'
import { normalizeTextInput } from '@/lib/text'
import {
  getPurchaseInvoiceFileExtension,
  isAllowedPurchaseInvoiceExtension,
  isAllowedPurchaseInvoiceMimeType,
  MAX_PURCHASE_INVOICE_UPLOAD_BYTES,
} from '@/lib/purchase-invoice'
import {
  invoiceExtractionSchema,
  purchaseImportDraftSchema,
  purchaseImportResponseSchema,
  type InvoiceExtraction,
  type PurchaseImportDraft,
  type PurchaseImportItem,
  type PurchaseImportResponse,
  type PurchaseImportWarning,
} from '@/server/schemas/purchases/purchase-import.schema'

function normalizeSearchText(value: string) {
  return normalizeTextInput(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string) {
  return normalizeSearchText(value).split(' ').filter(Boolean)
}

function similarityScore(a: string, b: string) {
  const left = normalizeSearchText(a)
  const right = normalizeSearchText(b)

  if (!left || !right) return 0
  if (left === right) return 1
  if (left.includes(right) || right.includes(left)) {
    const shorter = Math.min(left.length, right.length)
    const longer = Math.max(left.length, right.length)
    return Math.max(0.7, shorter / longer)
  }

  const leftTokens = new Set(tokenize(left))
  const rightTokens = new Set(tokenize(right))
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length
  const union = new Set([...leftTokens, ...rightTokens]).size || 1
  const tokenScore = intersection / union
  const charScore = 1 - levenshteinDistance(left, right) / Math.max(left.length, right.length)

  return Math.max(tokenScore, charScore)
}

function levenshteinDistance(a: string, b: string) {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i += 1) matrix[i]![0] = i
  for (let j = 0; j <= b.length; j += 1) matrix[0]![j] = j

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost
      )
    }
  }

  return matrix[a.length]![b.length] ?? 0
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeDigits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '')
}

function normalizeMaybeString(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed
}

function normalizeDateValue(value: string | null | undefined) {
  const raw = normalizeMaybeString(value)
  if (!raw) return new Date().toISOString()
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

function normalizeOptionalDateValue(value: string | null | undefined) {
  const raw = normalizeMaybeString(value)
  if (!raw) return ''
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

function mimeTypeFromBuffer(buffer: Buffer) {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === '%PDF') return 'application/pdf'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg'
  return 'application/octet-stream'
}

async function validateUploadFile(file: File) {
  const size = file.size
  const fileName = file.name?.trim() || 'documento'
  const extension = getPurchaseInvoiceFileExtension(fileName)
  const mimeType = normalizeMaybeString(file.type).toLowerCase()

  if (!size) {
    throw new AppError('O arquivo enviado está vazio.', 400)
  }

  if (size > MAX_PURCHASE_INVOICE_UPLOAD_BYTES) {
    throw new AppError('Arquivo muito grande. Envie um arquivo de até 10 MB.', 413)
  }

  if (!isAllowedPurchaseInvoiceExtension(extension)) {
    throw new AppError('Tipo de arquivo não permitido. Use PDF, JPG, JPEG ou PNG.', 400)
  }

  if (!mimeType || !isAllowedPurchaseInvoiceMimeType(mimeType)) {
    throw new AppError('MIME type do arquivo inválido.', 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!buffer.length) {
    throw new AppError('O arquivo enviado está vazio.', 400)
  }

  const sniffed = mimeTypeFromBuffer(buffer)
  if (sniffed !== mimeType) {
    throw new AppError('O arquivo não corresponde ao tipo informado.', 400)
  }

  return { buffer, fileName, extension, mimeType }
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new AppError('OPENAI_API_KEY não configurada.', 500)
  }

  return new OpenAI({ apiKey })
}

function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini'
}

function toJsonSchemaPrompt() {
  return [
    'Extraia os dados da nota fiscal para preenchimento manual de uma compra.',
    'Não invente dados ausentes.',
    'Use null, string vazia ou lista vazia quando o dado não estiver claramente presente.',
    'Não gere userId, _id, productId, supplierId, createdAt ou updatedAt.',
    'Mantenha números como números, sem símbolos monetários.',
    'Preserve as descrições dos itens conforme aparecem na nota.',
  ].join(' ')
}

function normalizeExtraction(input: InvoiceExtraction): InvoiceExtraction {
  return {
    supplier: {
      name: normalizeMaybeString(input.supplier.name),
      document: normalizeDigits(input.supplier.document ?? null) || null,
    },
    invoiceNumber: normalizeMaybeString(input.invoiceNumber) || null,
    invoiceAccessKey: normalizeDigits(input.invoiceAccessKey ?? null) || null,
    purchaseDate: normalizeMaybeString(input.purchaseDate) || null,
    expectedDelivery: normalizeMaybeString(input.expectedDelivery) || null,
    paymentMethod: normalizeMaybeString(input.paymentMethod) || null,
    paymentCondition: input.paymentCondition.map((value) => normalizeMaybeString(value)).filter(Boolean),
    subtotal: roundCurrency(input.subtotal),
    discounts: roundCurrency(input.discounts),
    freight: roundCurrency(input.freight),
    otherExpenses: roundCurrency(input.otherExpenses),
    total: roundCurrency(input.total),
    items: input.items.map((item) => ({
      supplierCode: normalizeMaybeString(item.supplierCode ?? null) || null,
      barcode: normalizeDigits(item.barcode ?? null) || null,
      description: normalizeMaybeString(item.description),
      productName: normalizeMaybeString(item.productName),
      brand: normalizeMaybeString(item.brand ?? null) || null,
      category: normalizeMaybeString(item.category ?? null) || null,
      quantity: Number(item.quantity),
      unit: normalizeMaybeString(item.unit),
      unitPrice: roundCurrency(item.unitPrice),
      discount: roundCurrency(item.discount),
      subtotal: roundCurrency(item.subtotal),
    })),
  }
}

async function findSupplier(userId: string, extracted: InvoiceExtraction['supplier']) {
  const document = normalizeDigits(extracted.document ?? null)
  if (document) {
    const byDocument = await SupplierModel.findOne({
      userId,
      $or: [
        { name: { $regex: `^${escapeRegExp(extracted.name)}$`, $options: 'i' } },
      ],
    }).lean<SupplierDocumentShape | null>()

    if (byDocument) {
      return { supplier: byDocument, confidence: 1 }
    }
  }

  const normalizedName = normalizeSearchText(extracted.name)
  const suppliers = await SupplierModel.find({ userId }).sort({ name: 1 }).lean<SupplierDocumentShape[]>()

  const exact = suppliers.find((supplier) => normalizeSearchText(supplier.name) === normalizedName)
  if (exact) {
    return { supplier: exact, confidence: 1 }
  }

  let best: SupplierDocumentShape | null = null
  let bestScore = 0
  for (const supplier of suppliers) {
    const score = similarityScore(supplier.name, extracted.name)
    if (score > bestScore) {
      best = supplier
      bestScore = score
    }
  }

  if (best && bestScore >= 0.82) {
    return { supplier: best, confidence: bestScore }
  }

  return { supplier: null, confidence: 0 }
}

type ProductMatch = {
  product: ProductDocumentShape | null
  status: PurchaseImportItem['matchStatus']
  confidence: number
  suggestions: PurchaseImportItem['suggestedProducts']
}

async function findProductByCode(userId: string, code: string) {
  const normalizedCode = normalizeDigits(code)
  if (!normalizedCode) return null

  const inventory = await InventoryModel.findOne({
    userId,
    $or: [{ sku: normalizedCode }, { productId: normalizedCode }],
  }).lean<InventoryDocumentShape | null>()

  if (inventory) {
    const byId = await ProductModel.findOne({ userId, _id: inventory.productId }).lean<ProductDocumentShape | null>()
    if (byId) return byId
  }

  return null
}

async function matchProduct(userId: string, item: InvoiceExtraction['items'][number]): Promise<ProductMatch> {
  const exactByCode = await findProductByCode(userId, item.barcode ?? item.supplierCode ?? '')
  if (exactByCode) {
    return { product: exactByCode, status: 'exact', confidence: 1, suggestions: [] }
  }

  const normalizedItemName = normalizeSearchText(item.productName)
  const normalizedBrand = normalizeSearchText(item.brand ?? '')
  const normalizedUnit = normalizeSearchText(item.unit)

  const products = await ProductModel.find({ userId }).sort({ product: 1 }).lean<ProductDocumentShape[]>()
  const exact = products.find((product) => {
    const normalizedProduct = normalizeSearchText(product.name)
    const normalizedProductBrand = normalizeSearchText(product.brand)
    const normalizedProductUnit = normalizeSearchText(product.unit)

    return (
      normalizedProduct === normalizedItemName &&
      (!normalizedBrand || normalizedProductBrand === normalizedBrand) &&
      (!normalizedUnit || normalizedProductUnit === normalizedUnit)
    )
  })

  if (exact) {
    return { product: exact, status: 'exact', confidence: 1, suggestions: [] }
  }

  const scored = products
    .map((product) => {
      const nameScore = similarityScore(product.name, item.productName)
      const brandScore = item.brand ? similarityScore(product.brand, item.brand) : 0.5
      const unitScore = item.unit ? similarityScore(product.unit, item.unit) : 0.5
      const score = roundCurrency(nameScore * 0.65 + brandScore * 0.2 + unitScore * 0.15)
      return { product, score }
    })
    .filter((entry) => entry.score >= 0.68)
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  const second = scored[1]

  if (!best) {
    return {
      product: null,
      status: 'not_found',
      confidence: 0,
      suggestions: scored.slice(0, 3).map((entry) => ({
        productId: String(entry.product._id),
        productName: entry.product.name,
        brand: entry.product.brand,
        unit: entry.product.unit,
        similarity: entry.score,
      })),
    }
  }

  if (second && second.score >= 0.78 && Math.abs(best.score - second.score) <= 0.08) {
    return {
      product: null,
      status: 'multiple_matches',
      confidence: best.score,
      suggestions: scored.slice(0, 3).map((entry) => ({
        productId: String(entry.product._id),
        productName: entry.product.name,
        brand: entry.product.brand,
        unit: entry.product.unit,
        similarity: entry.score,
      })),
    }
  }

  return { product: best.product, status: best.score >= 0.82 ? 'similar' : 'similar', confidence: best.score, suggestions: scored.slice(0, 3).map((entry) => ({
    productId: String(entry.product._id),
    productName: entry.product.name,
    brand: entry.product.brand,
    unit: entry.product.unit,
    similarity: entry.score,
  })) }
}

async function findProfitPercentage(userId: string, productId: string) {
  const inventory = await InventoryModel.findOne({ userId, productId }).lean<InventoryDocumentShape | null>()
  if (inventory && Number.isFinite(inventory.profitPercentage)) {
    return inventory.profitPercentage
  }

  const purchase = await PurchaseModel.findOne({ userId, 'items.productId': productId }).sort({ createdAt: -1 }).lean<{
    items?: Array<{ productId: string; profitPercentage?: number }>
  } | null>()

  const matchedItem = purchase?.items?.find((item) => item.productId === productId)
  if (matchedItem && Number.isFinite(matchedItem.profitPercentage)) {
    return matchedItem.profitPercentage ?? 50
  }

  return 50
}

function calculateItemSubtotal(quantity: number, unitPrice: number, discount: number) {
  return roundCurrency(quantity * unitPrice - discount)
}

function calculateTotals(items: PurchaseImportItem[], discounts: number, freight: number, otherExpenses: number) {
  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.subtotal, 0))
  const total = roundCurrency(subtotal - discounts + freight + otherExpenses)
  return { subtotal, total }
}

function addWarning(warnings: PurchaseImportWarning[], warning: PurchaseImportWarning) {
  warnings.push(warning)
}

function compareMonetaryValue(calculated: number, extracted: number, field: string, warnings: PurchaseImportWarning[]) {
  if (Math.abs(calculated - extracted) > 0.02) {
    addWarning(warnings, {
      field,
      message: `Divergência no campo ${field}. Valor calculado ${calculated.toFixed(2)} e valor extraído ${extracted.toFixed(2)}.`,
    })
  }
}

async function parseOpenAIExtraction(buffer: Buffer, fileName: string) {
  const client = getOpenAIClient()
  const model = getOpenAIModel()

  const response = await client.responses.parse({
    model,
    instructions: toJsonSchemaPrompt(),
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'Extraia a nota fiscal e devolva apenas o JSON estruturado.' },
          { type: 'input_file', file_data: buffer.toString('base64'), filename: fileName, detail: 'high' },
        ],
      },
    ],
    text: {
      format: zodTextFormat(invoiceExtractionSchema, 'purchase_invoice_extraction'),
    },
  })

  const raw = response.output_parsed ?? (response.output_text ? JSON.parse(response.output_text) : null)
  if (!raw) {
    throw new AppError('Resposta inválida da OpenAI.', 502)
  }

  return invoiceExtractionSchema.parse(raw)
}

function isOpenAIAuthError(error: unknown) {
  return error instanceof AuthenticationError || error instanceof PermissionDeniedError
}

function isOpenAIRateLimitError(error: unknown) {
  return error instanceof RateLimitError
}

function isOpenAITimeoutError(error: unknown) {
  return error instanceof APIConnectionTimeoutError
}

function isOpenAIUnavailableError(error: unknown) {
  return error instanceof APIConnectionError || error instanceof InternalServerError || error instanceof BadRequestError || error instanceof UnprocessableEntityError
}

function mapOpenAIError(error: unknown) {
  if (isOpenAIAuthError(error)) {
    return new AppError('Chave da OpenAI ausente ou inválida.', 500)
  }

  if (isOpenAIRateLimitError(error)) {
    return new AppError('Limite de requisições da OpenAI atingido. Tente novamente em instantes.', 429)
  }

  if (isOpenAITimeoutError(error)) {
    return new AppError('Timeout ao consultar a OpenAI.', 504)
  }

  if (isOpenAIUnavailableError(error)) {
    return new AppError('OpenAI indisponível no momento.', 503)
  }

  if (error instanceof APIError) {
    return new AppError('Falha ao consultar a OpenAI.', error.status ?? 502)
  }

  return error
}

function buildPurchaseImportDraft(
  extracted: InvoiceExtraction,
  supplierResult: Awaited<ReturnType<typeof findSupplier>>,
  matchedItems: Array<{ item: InvoiceExtraction['items'][number]; productMatch: ProductMatch; profitPercentage: number; salePrice: number }>
): PurchaseImportDraft {
  const items: PurchaseImportItem[] = matchedItems.map(({ item, productMatch, profitPercentage, salePrice }) => {
    const product = productMatch.product
    const normalizedName = normalizeMaybeString(item.productName)
    const normalizedBrand = normalizeMaybeString(item.brand ?? null)
    const normalizedUnit = normalizeMaybeString(item.unit)
    const productLabel = product
      ? product.product || buildProductLabel(product.name, product.unit, product.brand)
      : buildProductLabel(normalizedName, normalizedUnit, normalizedBrand)

    return {
      supplierCode: item.supplierCode ?? null,
      barcode: item.barcode ?? null,
      description: item.description,
      productId: product ? String(product._id) : null,
      productName: product ? product.name : normalizedName,
      product: productLabel,
      brand: product ? product.brand : normalizedBrand || null,
      category: item.category ?? null,
      quantity: item.quantity,
      unit: product ? product.unit : normalizedUnit,
      unitPrice: item.unitPrice,
      discount: item.discount,
      subtotal: item.subtotal,
      salePrice,
      profitPercentage,
      matchStatus: productMatch.status,
      matchConfidence: productMatch.confidence,
      suggestedProducts: productMatch.suggestions ?? [],
    }
  })

  const purchase = purchaseImportDraftSchema.parse({
    supplierId: supplierResult.supplier ? String(supplierResult.supplier._id) : null,
    supplier: supplierResult.supplier?.name ?? extracted.supplier.name,
    supplierDocument: extracted.supplier.document ? normalizeDigits(extracted.supplier.document) : null,
    invoiceNumber: normalizeMaybeString(extracted.invoiceNumber) || '',
    invoiceAccessKey: normalizeMaybeString(extracted.invoiceAccessKey) || '',
    purchaseDate: normalizeDateValue(extracted.purchaseDate),
    expectedDelivery: normalizeOptionalDateValue(extracted.expectedDelivery),
    paymentCondition: extracted.paymentCondition.map((value) => normalizeMaybeString(value)).filter(Boolean),
    paymentMethod: normalizeMaybeString(extracted.paymentMethod) || '',
    subtotal: roundCurrency(extracted.subtotal),
    discounts: roundCurrency(extracted.discounts),
    freight: roundCurrency(extracted.freight),
    otherExpenses: roundCurrency(extracted.otherExpenses),
    total: roundCurrency(extracted.total),
    items,
  })

  return purchase
}

function buildWarnings(
  extracted: InvoiceExtraction,
  purchase: PurchaseImportDraft,
  matchedItems: Array<{ item: InvoiceExtraction['items'][number]; productMatch: ProductMatch; profitPercentage: number; salePrice: number }>
) {
  const warnings: PurchaseImportWarning[] = []
  const recalculatedItems = purchase.items.map((item, index) => {
    const original = matchedItems[index]!
    const subtotal = calculateItemSubtotal(item.quantity, item.unitPrice, item.discount)
    compareMonetaryValue(subtotal, original.item.subtotal, `items.${index}.subtotal`, warnings)
    if (item.matchStatus === 'not_found') {
      addWarning(warnings, { itemIndex: index, field: `items.${index}.productId`, message: 'Produto não encontrado. Revise a associação manualmente.' })
    }
    if (item.matchStatus === 'multiple_matches') {
      addWarning(warnings, { itemIndex: index, field: `items.${index}.productId`, message: 'Mais de um produto pode corresponder a este item.' })
    }
    return { ...item, subtotal }
  })

  const totals = calculateTotals(recalculatedItems, purchase.discounts, purchase.freight, purchase.otherExpenses)
  compareMonetaryValue(totals.subtotal, extracted.subtotal, 'subtotal', warnings)
  compareMonetaryValue(totals.total, extracted.total, 'total', warnings)

  if (recalculatedItems.length === 0) {
    addWarning(warnings, { message: 'Documento sem produtos identificáveis.' })
  }

  return warnings
}

function determineStatus(items: PurchaseImportItem[], warnings: PurchaseImportWarning[]): 'ready_for_review' | 'review_required' {
  const allExact = items.every((item) => item.matchStatus === 'exact')
  return allExact && warnings.length === 0 ? 'ready_for_review' : 'review_required'
}

export async function importPurchaseInvoice(file: File): Promise<PurchaseImportResponse> {
  await connectToDatabase()
  const currentUser = await requireCurrentUser()
  const validatedFile = await validateUploadFile(file)

  let extracted: InvoiceExtraction
  try {
    extracted = normalizeExtraction(await parseOpenAIExtraction(validatedFile.buffer, validatedFile.fileName))
  } catch (error) {
    throw mapOpenAIError(error)
  }

  if (!extracted.items.length) {
    throw new AppError('Documento sem produtos identificáveis.', 422)
  }

  const supplierResult = await findSupplier(currentUser.id, extracted.supplier)
  const matchedItems: Array<{ item: InvoiceExtraction['items'][number]; productMatch: ProductMatch; profitPercentage: number; salePrice: number }> = []
  for (const item of extracted.items) {
    const productMatch = await matchProduct(currentUser.id, item)
    const productId = productMatch.product ? String(productMatch.product._id) : null
    const profitPercentage = productId ? await findProfitPercentage(currentUser.id, productId) : 50
    const salePrice = calculatePurchaseSalePrice(item.unitPrice, profitPercentage)
    matchedItems.push({ item, productMatch, profitPercentage, salePrice })
  }

  const purchase = buildPurchaseImportDraft(extracted, supplierResult, matchedItems)
  const warnings = buildWarnings(extracted, purchase, matchedItems)
  const totals = calculateTotals(purchase.items, purchase.discounts, purchase.freight, purchase.otherExpenses)
  const normalizedPurchase = purchaseImportDraftSchema.parse({
    ...purchase,
    subtotal: totals.subtotal,
    total: totals.total,
    items: purchase.items.map((item, index) => ({
      ...item,
      subtotal: calculateItemSubtotal(item.quantity, item.unitPrice, item.discount),
      salePrice: matchedItems[index]?.salePrice ?? item.salePrice,
      profitPercentage: matchedItems[index]?.profitPercentage ?? item.profitPercentage,
    })),
  })

  const response = purchaseImportResponseSchema.parse({
    status: determineStatus(normalizedPurchase.items, warnings),
    purchase: normalizedPurchase,
    warnings,
    summary: {
      totalItems: normalizedPurchase.items.length,
      matchedItems: normalizedPurchase.items.filter((item) => item.matchStatus === 'exact' || item.matchStatus === 'similar').length,
      reviewItems: normalizedPurchase.items.filter((item) => item.matchStatus === 'similar' || item.matchStatus === 'multiple_matches').length,
      notFoundItems: normalizedPurchase.items.filter((item) => item.matchStatus === 'not_found').length,
    },
  })

  return response
}

export { determineStatus, mimeTypeFromBuffer, similarityScore }
