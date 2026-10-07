import { connectToDatabase } from '@/server/db/mongodb'
import { requireStoreContext } from '@/server/auth/store-context'
import { AppError } from '@/server/errors/app-error'
import {
  InventoryCategoryModel,
  type InventoryCategoryDTO,
  type InventoryCategoryDocumentShape,
} from '@/server/models/inventory-categories/inventory-categories.model'
import {
  inventoryCategoryCreateSchema,
  type CreateInventoryCategoryInput,
} from '@/server/schemas/inventory-categories/inventory-categories.schema'
import { normalizeTextInput } from '@/lib/text'

function toDTO(category: InventoryCategoryDocumentShape): InventoryCategoryDTO {
  return {
    id: String(category._id),
    name: category.name,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }
}

export const InventoryCategoryService = {
  async list() {
    await connectToDatabase()
    const context = await requireStoreContext()
    const categories = await InventoryCategoryModel.find({ storeId: context.storeId }).sort({ name: 1 }).lean<InventoryCategoryDocumentShape[]>()
    return categories.map(toDTO)
  },

  async create(data: unknown) {
    await connectToDatabase()
    const context = await requireStoreContext()
    const parsed = inventoryCategoryCreateSchema.parse(data) as CreateInventoryCategoryInput
    const normalized = normalizeTextInput(parsed.name)

    const duplicate = await InventoryCategoryModel.findOne({
      storeId: context.storeId,
      name: { $regex: `^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    }).lean<InventoryCategoryDocumentShape | null>()

    if (duplicate) {
      throw new AppError('Já existe uma categoria cadastrada com esse nome.', 409)
    }

    const created = await InventoryCategoryModel.create({ storeId: context.storeId, userId: context.actorId, createdBy: context.actorId, updatedBy: context.actorId, name: normalized })
    return toDTO(created)
  },
}
