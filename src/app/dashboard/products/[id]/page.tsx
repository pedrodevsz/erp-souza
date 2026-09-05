import { ProductViewPage } from '@/components/products/view/product-view-page'

type Props = {
  params: {
    id: string
  }
}

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = params

  return <ProductViewPage id={id} />
}
