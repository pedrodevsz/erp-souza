import { CustomerViewPage } from '@/components/customers/view/customer-view-page'

type Props = {
    params: Promise<{
        id: string
    }>
}

export default async function CustomerViewRoutePage({ params }: Props) {
    const { id } = await params
    return <CustomerViewPage id={id} />
}
