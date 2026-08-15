export const InventoryCategoryService = {
  async getAll(): Promise<string[]> {
    const response = await fetch('/api/inventory-categories', {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const payload = (await response.json().catch(() => null)) as
      | { success: true; data: Array<{ name: string }> }
      | { success: false; message: string }
      | null

    if (!response.ok || !payload || payload.success === false) {
      throw new Error(payload && 'message' in payload ? payload.message : 'Não foi possível carregar categorias.')
    }

    return payload.data.map((category) => category.name)
  },

  async create(name: string): Promise<string[]> {
    const normalized = name.trim()
    if (!normalized) {
      return this.getAll()
    }

    const response = await fetch('/api/inventory-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: normalized }),
    })

    const payload = (await response.json().catch(() => null)) as
      | { success: true; data: { name: string } }
      | { success: false; message: string }
      | null

    if (!response.ok || !payload || payload.success === false) {
      if (response.status === 409) {
        return this.getAll()
      }

      throw new Error(payload && 'message' in payload ? payload.message : 'Não foi possível criar a categoria.')
    }

    return this.getAll()
  },
}
