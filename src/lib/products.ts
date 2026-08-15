export type ProductInput = {
  name: string
  unit: string
  brand: string
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

export function buildProductLabel(name: string | null | undefined, unit: string | null | undefined, brand: string | null | undefined) {
  return [normalizeText(name), normalizeText(unit), normalizeText(brand)].filter(Boolean).join(' ')
}

export function normalizeProductInput(input: ProductInput): ProductInput {
  return {
    name: normalizeText(input.name).replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR'),
    unit: normalizeText(input.unit).replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR'),
    brand: normalizeText(input.brand).replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR'),
  }
}
