import { PurchaseViewPage } from '@/components/purchases/view/purchase-view-page'

type Props = {
    params: Promise<{
        id: string
    }>
}

export default async function PurchaseViewRoutePage({ params }: Props) {
    const { id } = await params
    return <PurchaseViewPage id={id} />
}
