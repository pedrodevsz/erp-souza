export interface Address {
  zipCode: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
}

export interface Customer {
  id: string
  name: string
  document: string
  phone: string
  addresses: Address[]
  notes: string
  paymentReceived?: boolean
  createdAt: string
  updatedAt: string
}

export type NewCustomer = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'document'> & {
  document?: string
}

export type UpdateCustomer = Partial<NewCustomer>
