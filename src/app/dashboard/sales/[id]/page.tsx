import { SaleViewPage } from '@/components/sales/view/sale-view-page'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function SaleViewRoutePage({ params }: Props) {
  const { id } = await params
  return <SaleViewPage id={id} />
}
