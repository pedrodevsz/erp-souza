export type CustomerAddress = {
  zipCode: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
}

export type Customer = {
  id: string
  name: string
  document: string
  phone: string
  addresses: CustomerAddress[]
  notes: string
  createdAt: string
  updatedAt: string
}

export type CreateCustomerInput = {
  name: string
  document?: string
  phone?: string
  addresses?: Partial<CustomerAddress>[]
  notes?: string
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>

type ApiSuccessResponse<T> = {
  success: true
  data: T
}

type ApiErrorResponse = {
  success: false
  message: string
}

class CustomerApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'CustomerApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json().catch(() => null)) as ApiSuccessResponse<T> | ApiErrorResponse | null

  if (!response.ok || !payload || payload.success === false) {
    throw new CustomerApiError(
      payload && 'message' in payload ? payload.message : 'Não foi possível processar a requisição.',
      response.status
    )
  }

  return payload.data
}

export async function getCustomers(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return request<Customer[]>(`/api/customers${query}`)
}

export async function getCustomerById(id: string) {
  return request<Customer>(`/api/customers/${id}`)
}

export async function createCustomer(data: CreateCustomerInput) {
  return request<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  return request<Customer>(`/api/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteCustomer(id: string) {
  await request<{ id: string; deleted: true }>(`/api/customers/${id}`, {
    method: 'DELETE',
  })
}

export { CustomerApiError }
