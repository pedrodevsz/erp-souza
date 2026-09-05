import type { InventoryItem, InventoryMovement } from '@/types/inventory'
import { calculateAvailableStock, calculateInventoryProfitPercentage } from '@/lib/inventories/inventory'
import { buildProductLabel } from '@/lib/products'

const SUPPLIERS = [
  'Cimenteco Ltda',
  'Depósito Norte',
  'Casa do Construtor',
  'Aços Brava',
  'HidraSul Materiais',
  'Tintas União',
]

const CATEGORIES = [
  'Cimento',
  'Areia',
  'Brita',
  'Alvenaria',
  'Aço',
  'Telhas',
  'Argamassas',
  'Rejuntes',
  'Hidráulico',
  'Elétrico',
  'Tintas',
  'Ferramentas',
]

const LOCATIONS = [
  'A1 - Prateleira 01',
  'A1 - Prateleira 02',
  'B2 - Gôndola 01',
  'B2 - Gôndola 02',
  'C3 - Rua 01',
  'C3 - Rua 02',
]

const PRODUCT_NAMES = [
  'Cimento CP-II 50kg',
  'Areia Média',
  'Brita 1',
  'Tijolo Cerâmico 6 Furos',
  'Bloco de Concreto',
  'Vergalhão 10mm',
  'Telha Colonial',
  'Argamassa AC-II',
  'Rejunte Cinza',
  'Tubo PVC 100mm',
  'Tubo PVC 25mm',
  'Joelho PVC 90° 100mm',
  'Joelho PVC 90° 25mm',
  'Fio Elétrico 2,5mm',
  'Fio Elétrico 4mm',
  'Disjuntor 20A',
  'Disjuntor 40A',
  'Tinta Acrílica 18L',
  'Tinta Acrílica 3,6L',
  'Pincel 3"',
  'Rolo de Pintura 23cm',
  'Martelo Unha 27mm',
  'Trena 5m',
  'Luva de Raspa',
  'Máscara PFF2',
  'Impermeabilizante 18L',
  'Cal Hidratada 20kg',
  'Selador Acrílico 18L',
  'Caixa d\'Água 1000L',
  'Espátula de Aço 8cm',
]

const CURRENT_STOCKS = [
  120, 860, 42, 18, 74, 33, 0, 24, 9, 300,
  240, 56, 12, 410, 28, 6, 0, 15, 3, 52,
  47, 19, 31, 4, 0, 22, 68, 11, 2, 16,
]

const MINIMUM_STOCKS = [
  30, 200, 40, 20, 25, 20, 10, 18, 12, 50,
  40, 15, 10, 120, 30, 8, 5, 10, 5, 15,
  15, 10, 12, 5, 8, 10, 20, 10, 4, 8,
]

const RESERVED_STOCKS = [
  12, 45, 4, 2, 8, 5, 0, 3, 1, 18,
  14, 4, 1, 20, 2, 0, 0, 2, 0, 4,
  6, 1, 2, 0, 0, 3, 7, 1, 0, 2,
]

function nowISO(offsetDays = 0, offsetHours = 0) {
  const date = new Date()
  date.setDate(date.getDate() - offsetDays)
  date.setHours(date.getHours() - offsetHours)
  return date.toISOString()
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function buildItem(index: number): InventoryItem {
  const costPrice = roundCurrency(8 + index * 2.15)
  const salePrice = roundCurrency(costPrice * 1.42)
  const profitPercentage = calculateInventoryProfitPercentage(costPrice, salePrice)
  const currentStock = CURRENT_STOCKS[index]
  const minimumStock = MINIMUM_STOCKS[index]
  const reservedStock = RESERVED_STOCKS[index]
  const sku = `EST-${String(index + 1).padStart(4, '0')}`
  const lastEntryDate = nowISO(index + 1)
  const lastOutputDate = currentStock === 0 || index % 3 === 0 ? nowISO(index + 2, 4) : ''

  return {
    id: `inv-${String(index + 1).padStart(3, '0')}`,
    productId: sku,
    productName: PRODUCT_NAMES[index],
    brand: index % 3 === 0 ? 'Votoran' : index % 3 === 1 ? 'Delta' : 'Cerâmica São João',
    product: buildProductLabel(PRODUCT_NAMES[index], index % 2 === 0 ? 'un' : 'kg', index % 3 === 0 ? 'Votoran' : index % 3 === 1 ? 'Delta' : 'Cerâmica São João'),
    sku,
    category: CATEGORIES[index % CATEGORIES.length],
    unit: index % 2 === 0 ? 'un' : 'kg',
    costPrice,
    profitPercentage,
    salePrice,
    currentStock,
    minimumStock,
    reservedStock,
    availableStock: calculateAvailableStock(currentStock, reservedStock),
    location: LOCATIONS[index % LOCATIONS.length],
    supplier: SUPPLIERS[index % SUPPLIERS.length],
    lastEntryDate,
    lastOutputDate,
    notes: index % 4 === 0 ? 'Verificar lote e validade no próximo inventário.' : '',
    createdAt: nowISO(index + 18),
    updatedAt: nowISO(index + 1),
  }
}

function buildMovements(item: InventoryItem, index: number): InventoryMovement[] {
  const movements: InventoryMovement[] = [
    {
      id: `${item.id}-mv-1`,
      itemId: item.id,
      type: 'Entrada',
      quantity: item.currentStock + item.reservedStock + 20,
      date: nowISO(index + 30, 3),
      description: `Entrada inicial de ${item.product} recebida do fornecedor ${item.supplier}.`,
      user: 'Sistema',
    },
  ]

  if (item.reservedStock > 0) {
    movements.push({
      id: `${item.id}-mv-2`,
      itemId: item.id,
      type: 'Ajuste',
      quantity: item.reservedStock,
      date: nowISO(index + 15, 2),
      description: `Reserva atualizada para pedidos em aberto.`,
      user: 'Almoxarifado',
    })
  }

  if (item.currentStock <= item.minimumStock) {
    movements.push({
      id: `${item.id}-mv-3`,
      itemId: item.id,
      type: 'Saída',
      quantity: Math.max(1, Math.min(item.minimumStock - item.currentStock + 2, 12)),
      date: nowISO(index + 7, 1),
      description: `Baixa para atendimento de obras e reposição.`,
      user: 'Vendas',
    })
  }

  if (index % 5 === 0) {
    movements.push({
      id: `${item.id}-mv-4`,
      itemId: item.id,
      type: 'Transferência',
      quantity: 5,
      date: nowISO(index + 2),
      description: `Transferência interna para outro ponto de armazenagem.`,
      user: 'Logística',
    })
  }

  return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const MOCK_INVENTORY_ITEMS: InventoryItem[] = PRODUCT_NAMES.map((_, index) => buildItem(index))

export const MOCK_INVENTORY_MOVEMENTS: Record<string, InventoryMovement[]> = Object.fromEntries(
  MOCK_INVENTORY_ITEMS.map((item, index) => [item.id, buildMovements(item, index)])
)
