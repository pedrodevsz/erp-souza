import { ProductViewPage } from '@/components/products/view/product-view-page'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = await params

  return <ProductViewPage id={id} />
}
