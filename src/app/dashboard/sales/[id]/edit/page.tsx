import { SaleEditPage } from '@/components/sales/add/sale-edit-page'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function SaleEditRoutePage({ params }: Props) {
  const { id } = await params
  return <SaleEditPage id={id} />
}
