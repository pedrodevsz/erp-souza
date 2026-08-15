export const customerMessages = {
  created: 'Cliente criado com sucesso.',
  updated: 'Cliente atualizado com sucesso.',
  deleted: 'Cliente excluído com sucesso.',
  duplicate: 'Já existe um cliente cadastrado com este CPF/CNPJ.',
  notFound: 'Cliente não encontrado.',
} as const

export const saleMessages = {
  created: 'Venda criada com sucesso.',
  updated: 'Venda atualizada com sucesso.',
  deleted: 'Venda excluída com sucesso.',
  delivered: 'Venda marcada como entregue.',
  notFound: 'Venda não encontrada.',
} as const

export const purchaseMessages = {
  created: 'Compra criada com sucesso.',
  updated: 'Compra atualizada com sucesso.',
  deleted: 'Compra excluída com sucesso.',
  notFound: 'Compra não encontrada.',
} as const

export const supplierMessages = {
  created: 'Fornecedor criado com sucesso.',
  duplicate: 'Já existe um fornecedor cadastrado com este nome.',
  error: 'Não foi possível criar o fornecedor.',
} as const

export const sellerMessages = {
  created: 'Vendedor criado com sucesso.',
  updated: 'Vendedor atualizado com sucesso.',
  deleted: 'Vendedor excluído com sucesso.',
  duplicate: 'Já existe um vendedor cadastrado com este nome.',
  error: 'Não foi possível processar o vendedor.',
} as const

export const employeeMessages = {
  created: 'Funcionário criado com sucesso.',
  updated: 'Funcionário atualizado com sucesso.',
  deleted: 'Funcionário excluído com sucesso.',
  statusUpdated: 'Status do funcionário atualizado com sucesso.',
  notFound: 'Funcionário não encontrado.',
  error: 'Não foi possível processar o funcionário.',
} as const

export const productMessages = {
  created: 'Produto criado com sucesso.',
  updated: 'Produto atualizado com sucesso.',
  deleted: 'Produto excluído com sucesso.',
  duplicate: 'Já existe um produto com essa combinação.',
  error: 'Não foi possível processar o produto.',
} as const

export const reservationMessages = {
  created: 'Reserva criada com sucesso.',
  error: 'Não foi possível criar a reserva.',
} as const

export function getFeedbackErrorMessage(error: string | null | undefined, fallback: string) {
  return error?.trim() || fallback
}
