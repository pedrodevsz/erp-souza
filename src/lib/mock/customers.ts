import { Customer } from '@/types/customer'

function randomCpf() {
    // simple mock CPF-like string
    const nums = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('')
    return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function nowISO(offsetDays = 0) {
    const d = new Date()
    d.setDate(d.getDate() - offsetDays)
    return d.toISOString()
}

export const MOCK_CUSTOMERS: Customer[] = [
    {
        id: 'c1',
        name: 'João Silva',
        document: randomCpf(),
        phone: '(11) 99999-0001',
        addresses: [{
            zipCode: '01000-000',
            street: 'Rua das Flores',
            number: '123',
            complement: '',
            district: 'Centro',
            city: 'São Paulo',
            state: 'SP',
        }],
        notes: 'Cliente VIP',
        createdAt: nowISO(10),
        updatedAt: nowISO(5),
    },
    {
        id: 'c2',
        name: 'Maria Santos',
        document: randomCpf(),
        phone: '(21) 98888-0002',
        addresses: [{
            zipCode: '20000-000',
            street: 'Avenida Brasil',
            number: '456',
            complement: 'Apto 12',
            district: 'Copacabana',
            city: 'Rio de Janeiro',
            state: 'RJ',
        }],
        notes: '',
        createdAt: nowISO(12),
        updatedAt: nowISO(6),
    },
    {
        id: 'c3',
        name: 'Pedro Oliveira',
        document: randomCpf(),
        phone: '(31) 97777-0003',
        addresses: [{
            zipCode: '30000-000',
            street: 'Rua do Comércio',
            number: '789',
            complement: '',
            district: 'Centro',
            city: 'Belo Horizonte',
            state: 'MG',
        }],
        notes: '',
        createdAt: nowISO(20),
        updatedAt: nowISO(2),
    },
    // generate more programmatically
    ...Array.from({ length: 17 }).map((_, i) => {
        const idx = i + 4
        return {
            id: `c${idx}`,
            name: `Cliente ${idx}`,
            document: randomCpf(),
            phone: `(41) 97000-${String(1000 + idx).slice(-4)}`,
            addresses: [{
                zipCode: `8000${idx}-000`,
                street: `Rua Exemplo ${idx}`,
                number: `${100 + idx}`,
                complement: '',
                district: `Bairro ${idx}`,
                city: ['Curitiba', 'Fortaleza', 'Salvador', 'Recife', 'Natal'][i % 5],
                state: ['PR', 'CE', 'BA', 'PE', 'RN'][i % 5],
            }],
            notes: '',
            createdAt: nowISO(30 + i),
            updatedAt: nowISO(1 + i),
        }
    }),
]
