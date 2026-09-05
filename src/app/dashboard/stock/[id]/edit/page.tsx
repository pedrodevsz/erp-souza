import { InventoryEditPage } from '@/components/inventories/add/inventory-edit-page'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function StockEditRoutePage({ params }: Props) {
  const { id } = await params
  return <InventoryEditPage id={id} />
}
