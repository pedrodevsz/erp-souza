import { InventoryViewPage } from '@/components/inventories/view/inventory-view-page'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function StockDetailsPage({ params }: Props) {
  const { id } = await params
  return <InventoryViewPage id={id} />
}
