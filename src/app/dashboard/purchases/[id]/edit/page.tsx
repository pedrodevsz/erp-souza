import { PurchaseEditPage } from '@/components/purchases/add/purchase-edit-page'

type Props = {
    params: Promise<{
        id: string
    }>
}

export default async function PurchaseEditRoutePage({ params }: Props) {
    const { id } = await params
    return <PurchaseEditPage id={id} />
}
