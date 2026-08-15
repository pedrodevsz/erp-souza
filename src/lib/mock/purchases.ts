import { Purchase } from '@/types/purchases'
import { calculatePurchaseProfitPercentage } from '@/lib/purchases'

function nowISO(offsetDays = 0) {
    const d = new Date()
    d.setDate(d.getDate() - offsetDays)
    return d.toISOString()
}

export const MOCK_PURCHASES: Purchase[] = [
    {
        id: 'p1',
        supplier: 'Madeireira Central',
        purchaseDate: nowISO(2),
        expectedDelivery: nowISO(7),
        paymentCondition: ['30', '60', '90'],
        paymentMethod: 'Boleto',
        invoiceNumber: '12345',
        notes: 'Entrega prioritária',
        items: [
            { id: 'pi1', productId: 'prd1', productName: 'Cimento 50kg', category: 'geral', quantity: 10, unit: 'un', unitPrice: 30, profitPercentage: calculatePurchaseProfitPercentage(30, 45), salePrice: 45, discount: 0, subtotal: 300 },
        ],
        subtotal: 300,
        discounts: 0,
        freight: 50,
        otherExpenses: 0,
        total: 350,
        createdAt: nowISO(3),
        updatedAt: nowISO(2),
    },
    {
        id: 'p2',
        supplier: 'Ferros e Aços Ltda',
        purchaseDate: nowISO(5),
        expectedDelivery: nowISO(10),
        paymentCondition: ['À vista'],
        paymentMethod: 'Transferência',
        invoiceNumber: '54321',
        notes: '',
        items: [
            { id: 'pi2', productId: 'prd2', productName: 'Arame 2mm', category: 'geral', quantity: 20, unit: 'un', unitPrice: 5, profitPercentage: calculatePurchaseProfitPercentage(5, 8), salePrice: 8, discount: 0, subtotal: 100 },
        ],
        subtotal: 100,
        discounts: 0,
        freight: 20,
        otherExpenses: 0,
        total: 120,
        createdAt: nowISO(6),
        updatedAt: nowISO(5),
    },
    ...Array.from({ length: 8 }).map((_, i) => ({
        id: `p${i + 3}`,
        supplier: `Fornecedor ${i + 3}`,
        purchaseDate: nowISO(10 + i),
        expectedDelivery: null,
        paymentCondition: i % 2 === 0 ? ['30', '60'] : ['À vista'],
        paymentMethod: i % 2 === 0 ? 'Boleto' : 'Cartão',
        invoiceNumber: String(1000 + i),
        notes: '',
        items: [
            { id: `pi_${i + 3}`, productId: `prd_${i + 3}`, productName: `Produto ${i + 3}`, category: 'geral', quantity: 1 + i, unit: 'un', unitPrice: 10 + i, profitPercentage: calculatePurchaseProfitPercentage(10 + i, 15 + i), salePrice: 15 + i, discount: 0, subtotal: (1 + i) * (10 + i) },
        ],
        subtotal: (1 + i) * (10 + i),
        discounts: 0,
        freight: 0,
        otherExpenses: 0,
        total: (1 + i) * (10 + i),
        createdAt: nowISO(11 + i),
        updatedAt: nowISO(10 + i),
    })),
]
